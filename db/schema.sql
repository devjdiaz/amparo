-- ===========================================================================
-- AMPARO · esquema completo.
--
-- Sin ORM y sin migraciones: este archivo se aplica entero desde el SQL Editor
-- de Supabase y es idempotente. Queda versionado en el repositorio a propósito
-- — es evidencia auditable, no configuración invisible hecha a clics.
-- ===========================================================================

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Un caso es una nota de voz convertida en expediente.
-- ---------------------------------------------------------------------------
create table if not exists casos (
  id             uuid primary key default gen_random_uuid(),
  transcripcion  text,
  audio_url      text,
  confianza      real,              -- la que reporta Whisper
  -- Vista estructurada del caso. Cada campo viaja como {valor, hecho}: el id
  -- del hecho que lo sostiene. Un campo sin hecho no puede existir, y el hecho
  -- no puede existir sin origen (ver la tabla de abajo).
  expediente     jsonb,
  creado_en      timestamptz not null default now()
);

alter table casos add column if not exists expediente jsonb;

-- ---------------------------------------------------------------------------
-- LA TABLA QUE SOSTIENE LA TESIS.
--
-- Un hecho sin origen declarado NO ENTRA, y lo garantiza el esquema, no una
-- promesa del código. Son dos restricciones y las dos importan:
--
--   · origen_ref NOT NULL          → no se puede omitir
--   · CHECK length(trim(...)) > 0  → tampoco se puede mandar vacío
--
-- Sin el CHECK, origen_ref = '' pasaría el filtro. Esa es la línea que se
-- señala en el video.
--
-- El mismo invariante está replicado en TypeScript en motor/tipos.ts, para
-- que las pruebas corran sin base de datos.
-- ---------------------------------------------------------------------------
create table if not exists hechos (
  id           uuid primary key default gen_random_uuid(),
  caso_id      uuid not null references casos (id) on delete cascade,
  -- El id corto que usa el validador dentro del texto: [#h1], [#h2], ...
  ref          text not null,
  contenido    text not null,
  origen_tipo  text not null check (
                 origen_tipo in ('audio', 'documento', 'norma', 'sentencia', 'derivado')
               ),
  origen_ref   text not null,
  derivado_de  text[] not null default '{}',
  creado_en    timestamptz not null default now(),

  constraint origen_no_vacio check (length(trim(origen_ref)) > 0),
  -- Un hecho derivado tiene que declarar de qué hechos salió.
  --
  -- OJO con array_length: sobre un arreglo vacío devuelve NULL, no 0. Y un
  -- CHECK solo rechaza cuando la expresión da FALSE — con NULL deja pasar.
  -- La primera versión de esta restricción no rechazaba nada. cardinality()
  -- sí devuelve 0, que es lo que hace falta.
  constraint derivado_declara_padres check (
    origen_tipo <> 'derivado' or cardinality(derivado_de) >= 1
  ),
  constraint ref_unica_por_caso unique (caso_id, ref)
);

create index if not exists idx_hechos_caso on hechos (caso_id);

-- ---------------------------------------------------------------------------
-- Corpus de sentencias T-. Curado a mano y verificado una por una.
--
-- `subregla` es lo único que el redactor puede parafrasear. `verificada_el`
-- viaja al certificado: si una sentencia está vieja, se declara.
-- `etiquetas` es el gate determinístico del recuperador — una candidata solo
-- compite si sus etiquetas cruzan con el énfasis del caso, para que un
-- embedding malo no pueda producir una cita mala.
-- ---------------------------------------------------------------------------
create table if not exists sentencias (
  id             text primary key,            -- 'T-760/08'
  url            text not null,               -- relatoría de la Corte, viva
  tema           text not null,
  subregla       text not null,
  etiquetas      text[] not null default '{}',
  verificada_el  date not null,
  embedding      vector(1536),                -- text-embedding-3-small
  creado_en      timestamptz not null default now(),

  constraint url_es_enlace check (url ~ '^https?://')
);

-- El recuperador EN USO es determinístico y vive en motor/similitud.ts: puntúa
-- por IDF sobre las etiquetas y la subregla curadas a mano, y descompone cada
-- puntaje en las coincidencias que lo produjeron. Con un corpus de este tamaño
-- eso ordena mejor que un embedding y, sobre todo, se puede auditar: el
-- certificado dice "coincidió en medicamento (etiqueta), entrega (etiqueta)"
-- en vez de un coseno que nadie puede discutir.
--
-- La columna `embedding` y match_sentencias() quedan para cuando el corpus
-- pase de unas decenas de sentencias y el léxico deje de alcanzar. No hay
-- índice ivfflat todavía: sobre pocas filas degrada la búsqueda en vez de
-- acelerarla (el propio Postgres lo avisa al crearlo).

-- ---------------------------------------------------------------------------
-- Toda decisión persiste con su versión de motor, su hash de reglas, su
-- versión de corpus y su huella. Las omisiones nunca se silencian: el
-- certificado completo va en JSONB, incluidas las sentencias descartadas
-- con su motivo.
-- ---------------------------------------------------------------------------
create table if not exists decisiones (
  id             uuid primary key default gen_random_uuid(),
  caso_id        uuid not null references casos (id) on delete cascade,
  salida         text not null check (salida in ('PROCEDE', 'NO_PROCEDE', 'FALTAN_DATOS')),
  motor_version  text not null,
  reglas_hash    text not null,
  corpus_version text not null,
  huella         text not null,
  certificado    jsonb not null,
  redaccion      text,
  creado_en      timestamptz not null default now()
);

create index if not exists idx_decisiones_caso on decisiones (caso_id, creado_en desc);

-- ---------------------------------------------------------------------------
-- Recuperación por similitud de coseno.
--
-- Con un corpus pequeño el coseno en memoria bastaría, pero teniendo Postgres
-- montado queda mejor auditado y evita mantener un JSON de embeddings aparte.
-- El umbral se pasa desde el motor, no se fija acá: es una regla de negocio y
-- vive en recuperador.ts, a la vista.
-- ---------------------------------------------------------------------------
create or replace function match_sentencias(
  consulta   vector(1536),
  umbral     float default 0.0,
  k          int default 5,
  etiquetas_requeridas text[] default '{}'
)
returns table (
  id            text,
  url           text,
  tema          text,
  subregla      text,
  etiquetas     text[],
  verificada_el date,
  similitud     float
)
language sql stable
as $$
  select
    s.id,
    s.url,
    s.tema,
    s.subregla,
    s.etiquetas,
    s.verificada_el,
    1 - (s.embedding <=> consulta) as similitud
  from sentencias s
  where s.embedding is not null
    and (
      cardinality(etiquetas_requeridas) = 0
      or s.etiquetas && etiquetas_requeridas
    )
    and 1 - (s.embedding <=> consulta) >= umbral
  order by s.embedding <=> consulta
  limit k;
$$;

-- ---------------------------------------------------------------------------
-- Permisos.
--
-- Aplicar este archivo por psql (como rol `postgres`) no otorga nada al rol
-- que usa la API: PostgREST contesta 403 "permission denied for table". El
-- SQL Editor de Supabase sí otorga solo, así que el síntoma solo aparece
-- cuando el esquema se aplica desde afuera — que es justo lo que queremos
-- hacer para que quede versionado.
-- ---------------------------------------------------------------------------
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- Nota: no se habilita RLS. No hay login ni multi-tenant, y todo el acceso
-- pasa por route handlers del servidor con la llave secreta. Pelear con
-- políticas de permisos costaría una hora sin aportar nada al demo. El rol
-- publicable (anon) no recibe permisos: el navegador nunca habla con la base.
