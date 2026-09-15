import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['./src/**'],
    rules: {
      // Reglas duras: rompen la arquitectura si se violan.
      'fsd/forbidden-imports': 'error',
      'fsd/no-public-api-sidestep': 'error',
      'fsd/public-api': 'error',
      'fsd/no-cross-imports': 'error',
      'fsd/no-higher-level-imports': 'error',
      'fsd/no-ui-in-app': 'error',
      'fsd/no-processes': 'error',
      'fsd/no-reserved-folder-names': 'error',
      'fsd/segments-by-purpose': 'error',
      'fsd/typo-in-layer-name': 'error',
      // El esqueleto arranca con un slice por capa: aun no hay nada que agrupar.
      'fsd/insignificant-slice': 'off',
      'fsd/repetitive-naming': 'off',
    },
  },
])
