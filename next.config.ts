import type { NextConfig } from 'next';

/**
 * Deliberadamente mínimo.
 *
 * Acá vivía un `outputFileTracingExcludes` con la clave '*' que excluía las
 * carpetas del vault (`./0*/**`) del rastreo de archivos, para que las
 * funciones no cargaran con el peso de la documentación.
 *
 * Se quitó porque las dos rutas de API devolvían 500 en Vercel —error de
 * plataforma, la función ni arrancaba— mientras el mismo build corría bien en
 * local. La clave '*' aplica a TODAS las rutas, y en el contenedor de build de
 * Vercel el proyecto vive en un directorio llamado `path0`: un glob pensado
 * para `01 Producto` puede terminar mordiendo algo que la función necesita.
 *
 * Ahorrar unos kilobytes de tracing no vale un despliegue caído a las once de
 * la noche. Si alguna vez hace falta, se hace por ruta y no con comodín.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
