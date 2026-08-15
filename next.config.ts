import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // El vault vive en la misma carpeta que el código. Sin esto, el tracing de
  // archivos de Next se pasea por "06 Arsenal/" y por los assets de marca.
  outputFileTracingExcludes: {
    '*': ['./0*/**', './node_modules/@swc/core-linux-x64-gnu'],
  },
};

export default nextConfig;
