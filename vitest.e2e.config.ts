import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

// Suite de integracion: exige `npm run stack:up` y `npm run seed`.
// Vive en su propia config para que el `npm run check` por defecto no dependa
// de que Docker este levantado.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.e2e.test.ts'],
      testTimeout: 30000,
    },
  }),
)
