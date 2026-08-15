---
title: Bitácora hackathon CTW·2026
tags:
  - amparo/bitacora
aliases:
  - BITACORA-hackathon-ctw2026
---

# Bitácora · Hac[k]athon CTW·2026

> Registro completo del proceso de decisión: qué se evaluó, qué se descartó y por qué.
> Complementa a [[Documento maestro]], que tiene el detalle del proyecto elegido.

---

## 1 · El evento

| | |
|---|---|
| Evento | Hac[k]athon CTW·2026 — AI_FOR_PUBLIC_GOOD |
| Sede | Universidad del Rosario, Claustro · Calle 12C #6-25, La Candelaria, Bogotá |
| Inicio | Sábado 15 agosto, 10:00 |
| Cierre de entregas | Domingo 16 agosto, 09:00 |
| **Tiempo real** | **23 horas** |
| Entrega | Video de **máximo 1 minuto** + código al repositorio |
| **Pitch en vivo** | **No hay** |
| Equipo | Máximo 4 personas |
| Premio | USD 4.000 al primer puesto |

### Rúbrica

| Criterio | Puntos |
|---|---|
| Impacto público | 25 |
| Uso real de IA | 25 |
| Demo funcional | 20 |
| Viabilidad y escala | 15 |
| Ejecución técnica y UX | 15 |

**La restricción que más condiciona todo:** no hay pitch en vivo ni preguntas del jurado. Todo debe caber en 60 segundos de video o vivir en el repositorio. Eso convierte al README en el pitch real.

---

## 2 · Los cuatro tracks

| Track | Tema | Referentes | Datasets sugeridos |
|---|---|---|---|
| 01 | Transparencia — corrupción, falsificación, opacidad | SIGNA, Vía Libre / DATA Uruguay | SECOP, datos.gov.co |
| 02 | Justicia — acceso a asesoría legal | DoNotPay | Sentencias Rama Judicial, SUIN-Juriscol |
| 03 | Niños y jóvenes creadores — edtech con impacto medible | Arukay, CoSchool, Wumbox | DANE educación, deserción MEN, Pruebas Saber |
| 04 | Planeta y comunidad — resiliencia climática | Agrosmart, Agranimo | IDEAM, Sentinel, agro DANE |

---

## 3 · Opciones evaluadas

### AMPARO · Track 02 — **elegida**

Motor de decisión auditable aplicado a la acción de tutela. Entra una nota de voz en lenguaje coloquial, sale una tutela lista para radicar con jurisprudencia real y enlazada — o un no, con razones y ruta alterna.

Detalle completo en [[Documento maestro]] y [[Brief 24h]].

### RAÍZ · Track 04 y 02 — descartada

IA que diagnostica por qué un predio rural está en la informalidad (título sin registrar, sucesión ilíquida, falsa tradición, posesión, ocupación de baldío) y genera la ruta legal y los documentos para sanearlo.

**Por qué era fuerte:** el 54,3% de los predios rurales del país se explota sin título, casi 49 millones de hectáreas. La Ley 1561 de 2012 crea un proceso verbal especial exactamente para ese usuario. Y sin título no hay crédito agrícola, ni pago por servicios ambientales, ni incentivo para invertir a diez años — nadie siembra árboles en tierra que no sabe si es suya.

**Por qué se descartó:** la Ley 1561 exige presentar la demanda por intermedio de apoderado. A diferencia de la tutela, aquí sí se necesita abogado, lo que obliga a construir para consultorios jurídicos y no para el ciudadano. Sigue siendo una idea viva para después del evento.

### PLAZA · Track 04 — descartada

Marketplace hiperlocal anti-desperdicio: reloj de pérdida por producto, precio de rescate contra SIPSA, consolidación de rutas de entrega y foto-a-ficha. Diseñada para reutilizar la infraestructura de Publimercar (vitrina, mototaxi y carga, pagos Nequi/Daviplata).

**Por qué se descartó:** exigía apoyarse en producto preexistente y el núcleo de IA quedaba más débil que en las otras opciones.

### CENTINELA · Track 01 — descartada

Agente que lee pliegos de contratación pública antes de que cierren y detecta **pliegos sastre**: requisitos redactados a la medida de un proveedor. Genera la observación al pliego, fundamentada y lista para radicar dentro de la ventana en que la entidad está obligada a responder.

**Por qué era fuerte:** es la única opción que escalaba a otros países sin reescribir el producto, porque la contratación pública se publica en el estándar internacional OCDS y cambiar de país es cambiar un endpoint. Además detectar sobre-especificación en prosa jurídica no se puede hacer con SQL — necesita un LLM de verdad. Y el cliente que paga ya existe: el proveedor excluido artificialmente de una licitación.

**Por qué se descartó:** AMPARO permitía reutilizar más arquitectura propia y tenía un problema mejor documentado.

### Publimercar tal cual · sin track — descartada

Marketplace con medios de pago, mensajería, taxi, mototaxi, transporte de carga y un sistema de tokenización de tierras y activos.

**Por qué no encajaba:** no cae en ningún track; son dos productos distintos pegados (tokenización y marketplace horizontal); no hay IA en el núcleo, que son 25 de los 100 puntos; y la capa de tokenización tiene implicaciones regulatorias que no se resuelven en un fin de semana. Ver sección 6.

---

## 4 · Matriz de encaje

| | T01 Transparencia | T02 Justicia | T03 Edtech | T04 Planeta |
|---|---|---|---|---|
| **AMPARO** | Parcial — mapa de EPS que niegan | **Nativo** | Forzado | Forzado |
| **RAÍZ** | Parcial — catastro vs registro | **Nativo** | Sin ángulo | **Nativo** |
| **PLAZA** | Parcial — precio real al productor | Sin ángulo | Forzado | **Nativo** |

**Patrón observado:** las tres opciones tienen algo en la columna de transparencia, y no es coincidencia. Cualquier producto que le sirva a un ciudadano frente a una institución genera, como subproducto, evidencia de cómo falla esa institución. Pero ese dato residual no es el producto: presentarlo como Track 01 es pitchear el subproducto y esconder el producto.

**Track 03 fue un desierto para las tres.** Requiere impacto medible, y eso exige semanas de uso real.

---

## 5 · La decisión

**AMPARO, Track 02.** Cuatro razones:

1. **El problema está documentado con cifras oficiales recientes** y tiene un hallazgo contraintuitivo que sostiene el pitch entero: tres de cada cuatro tutelas ganan, pero los departamentos más pobres son los que menos tutelan. La barrera no es legal, es de redacción.
2. **El mecanismo legal ya funciona.** No hay que inventar una política pública: la tutela existe, es gratuita, no requiere abogado y falla en 10 días. Solo falta el acceso.
3. **Se reutiliza arquitectura propia ya probada.** Ver sección 7.
4. **Hay un problema difícil que va a hundir a los competidores del track** y que nosotros tenemos resuelto por arquitectura: los chatbots legales alucinan jurisprudencia.

### El riesgo asumido

Track 02 trae a DoNotPay como único referente y el reto está redactado casi como brief de producto. Es probable que sea el track más congestionado del evento. La apuesta es que la diferencia no esté en la idea sino en la ejecución: todos van a mostrar un chatbot que redacta; nosotros vamos a mostrar uno que **se niega a inventar** y otro que **se niega a generar** cuando el caso no procede.

---

## 6 · Publimercar: notas regulatorias

Se deja registrado porque afecta decisiones futuras de la empresa, no solo del hackathon.

**La actividad descrita** —recibir dinero de personas, tokenizarlo, invertirlo en agricultura e infraestructura y devolver ganancias— corresponde a la definición legal de **captación masiva y habitual de dineros del público**, actividad reservada a entidades vigiladas por la Superintendencia Financiera.

**Consecuencias documentadas** cuando se ejerce sin autorización: suspensión inmediata de actividades, orden de devolución de los recursos captados, traslado a Superintendencia de Sociedades y Fiscalía, solicitud a la Superintendencia de Notariado y Registro de abstenerse de registrar actos sobre los bienes del sujeto, e intervención judicial con toma de posesión. La responsabilidad recae sobre personas naturales identificadas, no sobre la sociedad. Los umbrales son bajos: hay casos configurados con obligaciones frente a poco más de veinte personas.

**La ruta legal existe.** Titularización y financiación colaborativa son figuras reconocidas en Colombia. Se ejecutan con un vehículo licenciado —sociedad titularizadora, fiduciaria con patrimonio autónomo, o sociedad de financiación colaborativa autorizada— y hay espacio de prueba regulatorio en la SFC para modelos nuevos. La arquitectura viable es: **el vehículo lo pone alguien con licencia y la empresa construye la capa de producto encima**. Así la empresa origina y opera pero no custodia recursos, que es donde está el riesgo.

**Acción recomendada:** consultar con un abogado de mercado de valores colombiano antes de recibir el primer peso de un tercero. Nada de lo anterior sustituye esa consulta.

### La versión legal de la misma ambición

Existe una forma de "generar valor para el usuario" sin tocar captación: **el historial transaccional como activo**. Cada transacción genera un registro verificable de ingresos para alguien que hoy es invisible para el sistema financiero. Eso no es captación, es dato — y es exactamente lo que le falta a un informal para volverse sujeto de crédito. La empresa origina, no custodia.

---

## 7 · Reuso de arquitectura

El equipo ya construyó un motor de decisión auditable (proyecto GarantÍA, hackathon Colsubsidio). Lo que se reutiliza es **el patrón, no los archivos**: repositorio nuevo desde cero.

| Patrón existente | Aplicación en AMPARO |
|---|---|
| Hecho sin origen declarado no entra a la memoria, garantizado por la base de datos | Afirmación sin norma o sentencia que la respalde no entra a la tutela |
| Scorecard de pesos visibles, no modelo entrenado | Las cuatro reglas de procedibilidad: legitimación, inmediatez, subsidiariedad, no temeridad |
| Nunca un no seco: razones y ruta de salida | Si no procede, explica y enruta a derecho de petición o queja ante Supersalud |
| El LLM redacta desde razones ya calculadas | El LLM redacta la tutela desde hechos y normas ya recuperados; no puede agregar una cita |
| Certificado de auditoría por decisión | Qué jurisprudencia se consultó, cuál aplicó y cuál se descartó |
| Modo lote con aprobación previa | Un consultorio jurídico procesando cientos de casos |

Cómo se implementa concretamente en código: [[Motor de procedibilidad]].

**Nota sobre divulgación:** reutilizar conocimiento propio no se declara — la línea está en código copiado, no en saber cómo se hace. Pero conviene distinguir entre no anunciarlo y esconderlo. Van a producir algo cuya calidad no cuadra con 23 horas y alguien va a preguntar cómo. La respuesta favorece al equipo: "ya construimos un motor de decisión auditable y sabemos lo que estamos haciendo".

---

## 8 · Aprendizajes transferibles

Sirven para este evento y para los siguientes.

**1 · El interruptor como técnica de demostración.**
Un control visible que prueba tu afirmación central en un segundo vale más que tres párrafos. Apagar el recuperador y mostrar que el sistema deja de citar en vez de inventar demuestra "no alucinamos" mejor que cualquier explicación. Es la pieza más valiosa que trae el equipo de su hackathon anterior, y no está en el código.

**2 · Mostrar el rechazo, no solo el éxito.**
Cualquiera muestra su sistema funcionando. Mostrar el momento en que se niega a actuar demuestra criterio, que es lo que separa un producto de un demo.

**3 · Cuando no hay pitch en vivo, el README es el pitch.**
Con un minuto de video, quien quiera profundizar solo tiene el repositorio. Ese documento pesa tanto como el código.

**4 · Congelar funcionalidades varias horas antes del cierre.**
Todo lo que se toque después es riesgo sin retorno. Vale más una hora extra de video bien grabado que una funcionalidad más a medias.

**5 · Escribir la suite de casos de referencia antes que el LLM.**
Es lo único que avisa si algo se rompió a las cinco de la mañana.

**6 · Un track, no cuatro.**
La rúbrica pregunta si resuelve un problema **del track**. Un proyecto que toca los cuatro no saca alto en ninguno: el jurado lee amplitud como falta de foco.

**7 · Diseñar para el intermediario, no para el usuario final.**
En contextos rurales o de baja conectividad, el canal institucional que ya existe —personerías, JAC, consultorios jurídicos, extensionistas— no es el caso borde, es el caso principal. Y reconocer a quién no se llega todavía da más credibilidad, no menos.

**8 · El celular casi nunca es lo que falta.**
Más del 90% de la población usa celular. Lo que falta es conexión: solo alrededor de un tercio de los hogares rurales tiene internet. Eso cambia el diseño: peso liviano, tolerancia a caídas, nada de video.

---

## 9 · Datos y fuentes

### Justicia — tutela

| Dato | Cifra | Fuente |
|---|---|---|
| Tutelas en salud, 2025 | ~312.500 | Defensoría del Pueblo, abr. 2026 |
| Porcentaje del total nacional | 34% | Defensoría del Pueblo |
| Crecimiento 2020–2025 | +162% | Defensoría del Pueblo |
| Tasa de concesión | 74,3% | Defensoría del Pueblo |
| Concentración | Antioquia 20,5% · Valle 10,3% · Bogotá 9,7% | Defensoría del Pueblo |

> Los departamentos con mayores niveles de pobreza multidimensional presentan las menores tasas de tutelas.

### Tierra

| Dato | Cifra | Fuente |
|---|---|---|
| Predios rurales explotados sin título | 54,3% · ~49 millones de ha | UPRA |
| Inmuebles con falsa tradición | 3,4 millones · 36% del total | SNR |
| Duración de la formalización | Hasta 10 años y 40 firmas | Banco Mundial |

### Alimentos

| Dato | Cifra | Fuente |
|---|---|---|
| Pérdida y desperdicio anual | 9,76 millones de toneladas · 34% de lo disponible | DNP |
| Dónde se pierde | Producción 40,5% · distribución 20,6% · poscosecha 19,8% | DNP |
| Frutas y verduras | 62% del total perdido | DNP |
| Inseguridad alimentaria moderada o grave | 26,1% de la población | DANE 2024 |

### Conectividad

| Dato | Cifra | Fuente |
|---|---|---|
| Población que usa celular | >90% | DANE |
| Hogares con internet, nacional | 59,5% | DANE |
| Hogares con internet, centros poblados y rural disperso | 32,2% | DANE |

### Marco normativo consultado

| Norma | Para qué |
|---|---|
| Art. 86 Constitución Política | La tutela no requiere abogado |
| Decreto 2591 de 1991 | Reglamenta la acción de tutela |
| Ley 1561 de 2012 | Proceso verbal especial de titulación y saneamiento de falsa tradición |
| Ley 1579 de 2012 | Estatuto de Registro de Instrumentos Públicos |
| Ley 1523 de 2012 | Gestión del riesgo de desastres. Sirve como filtro: predio en riesgo no mitigable no se titula |
| SUIN-Juriscol · Gestor Normativo | Verificación de vigencia |

**Advertencia:** verificar vigencia artículo por artículo antes de meter cualquier norma al corpus. Varias tienen apartes derogados o declarados inexequibles, y una cita a un artículo muerto destruye la credibilidad.

---

## 10 · Entregables generados

| Nota en el vault | Contenido |
|---|---|
| [[Documento maestro]] | Documento maestro: producto, marca, logo, registro de decisiones |
| [[Brief 24h]] | Arquitectura, alcance, plan hora por hora, guion del video de 60s |
| [[Playbook de marca]] | Playbook de marca extendido |
| [[02 Marca/assets/README|Pack de logo]] | Pack completo: lockups, símbolo, mono, favicon, OG image |
| [[Idea original]] | Primer brief de la idea, previo a la calibración a 23 horas |

---

## Pendientes

- [ ] Decidir el nombre final: `AMPARO` a secas o conservar la IA. Recomendación: quitarla. El logo está trazado a curvas y regenerarlo requiere volver a correr el generador.
- [ ] Definir los pesos numéricos de las cuatro reglas de procedibilidad
- [ ] Armar el corpus de 200–400 sentencias T- de salud
- [ ] Escribir la suite de tres casos de referencia antes que el LLM
- [ ] Verificar vigencia de cada norma antes de meterla al corpus
- [ ] Elegir el track en el formulario de registro
