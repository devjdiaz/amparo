import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    // El motor es TypeScript puro: sin red, sin base de datos, sin DOM.
    environment: 'node',
    include: ['motor/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules/**', '06 Arsenal/**'],
  },
  resolve: {
    alias: {
      '@/motor': fileURLToPath(new URL('./motor', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
