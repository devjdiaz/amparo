import type { NextConfig } from 'next';

// Deliberadamente mínimo.
//
// Acá vivía un `outputFileTracingExcludes` con la clave comodín que excluía
// las carpetas del vault del rastreo de archivos, para que las funciones no
// cargaran con el peso de la documentación.
//
// Se quitó porque las dos rutas de API devolvían 500 en Vercel —la página de
// error de la plataforma, no la de Next: la función ni arrancaba— mientras el
// mismo build corría bien en local. La clave comodín aplica a TODAS las rutas,
// y en el contenedor de build de Vercel el proyecto vive en un directorio
// llamado `path0`: un patrón escrito pensando en "01 Producto" puede terminar
// mordiendo algo que la función necesita.
//
// Ahorrar unos kilobytes de tracing no vale un despliegue caído a las once de
// la noche. Si alguna vez hace falta, se hace por ruta y no con comodín.
//
// (Nota aparte: la primera versión de este comentario iba en bloque /* */ e
// incluía el patrón literal, que contiene la secuencia que cierra un bloque de
// comentario. Cerraba el comentario a media frase y rompía el build. Por eso
// va en líneas //.)

const nextConfig: NextConfig = {};

export default nextConfig;
