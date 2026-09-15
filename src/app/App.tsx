import { RouterProvider } from 'react-router'

import { rutas } from './routing'
import { ThemeProvider } from './theme'

import './styles/index.scss'

/**
 * Composition root: tema global y enrutamiento.
 * Las rutas se declaran en `app/routing/rutas.tsx`.
 */
export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={rutas} />
    </ThemeProvider>
  )
}
