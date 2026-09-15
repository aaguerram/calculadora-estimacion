import { createBrowserRouter } from 'react-router'

import { AlcancePage } from '@/pages/alcance'
import { CalibracionPage } from '@/pages/calibracion'
import { FuentesPage } from '@/pages/fuentes'
import { HistoricoPage } from '@/pages/historico'
import { IngresarPage } from '@/pages/ingresar'
import { ProyectosPage } from '@/pages/proyectos'

import { Layout, NoEncontrado } from './Layout'

/**
 * Único sitio donde se declaran las rutas.
 * El proyecto activo viaja en la URL: así se comparte y se recarga sin perderlo.
 */
export const rutas = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: ProyectosPage },
      { path: 'proyecto/:proyectoId', Component: AlcancePage },
      { path: 'ingresar', Component: IngresarPage },
      { path: 'historico', Component: HistoricoPage },
      { path: 'calibracion', Component: CalibracionPage },
      { path: 'fuentes', Component: FuentesPage },
      { path: '*', Component: NoEncontrado },
    ],
  },
])
