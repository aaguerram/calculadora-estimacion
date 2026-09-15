//
// Public API de CROSS-IMPORT (notacion @x de FSD).
//
// `project-scope` necesita el vocabulario del modelo (tipos de componente,
// stacks, niveles de complejidad) para describir un alcance. Dos entities no
// pueden importarse por su index normal; este archivo declara de forma
// explicita y auditable que esa dependencia existe y que se limita a TIPOS.
//
export type {
  NivelComplejidad,
  StackTecnologico,
  TipoComponente,
} from '../model/types'
export {
  ETIQUETA_COMPLEJIDAD,
  ETIQUETA_TIPO,
  NIVELES_COMPLEJIDAD,
  TIPOS_COMPONENTE,
} from '../model/types'
