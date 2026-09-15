export {
  ALCANCE_VACIO,
} from './model/types'
export type {
  Alcance,
  AlcanceDeProyecto,
  ComponenteAlcance,
  DriverAlcance,
  FeatureAlcance,
  IntegracionAlcance,
  ElementoSeleccionado,
  Jornada,
  TocaComponente,
} from './model/types'

export {
  CATALOGO_DRIVERS,
  ETIQUETA_POSTURA,
  completarDrivers,
  posturaDeDelta,
} from './model/catalogo-drivers'
export type { DefinicionDriver, PosturaDriver } from './model/catalogo-drivers'

export { mapearAlcance, resumirAlcance } from './model/mapear-alcance'
export type { FilaScopeProyecto } from './model/mapear-alcance'

export {
  actualizarComponente,
  actualizarFeature,
  actualizarIntegracion,
  cargarAlcance,
  crearComponente,
  crearFeature,
  crearIntegracion,
  desvincularFeatureComponente,
  eliminarComponente,
  eliminarFeature,
  eliminarIntegracion,
  ajustarElemento,
  desmarcarElemento,
  fijarCategoriaFeature,
  fijarComplejidadDelPar,
  fijarDriver,
  marcarElemento,
  vincularFeatureComponente,
} from './api/project-scope.api'
export type {
  NuevaFeature,
  NuevaIntegracion,
  NuevoComponente,
} from './api/project-scope.api'
