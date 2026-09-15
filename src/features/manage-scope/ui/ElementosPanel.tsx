import { Checkbox, NumberInput, Select, SelectItem, Tag } from '@carbon/react'

import { ETIQUETA_COMPLEJIDAD, NIVELES_COMPLEJIDAD } from '@/entities/estimation-model'
import type { NivelComplejidad } from '@/entities/estimation-model'
import { ETIQUETA_FP, elementosDisponibles, puntosDeElemento } from '@/entities/feature-catalog'
import type { Catalogo } from '@/entities/feature-catalog'
import {
  ajustarElemento,
  desmarcarElemento,
  marcarElemento,
} from '@/entities/project-scope'
import type { FeatureAlcance } from '@/entities/project-scope'
import { cx } from '@/shared/lib'

import styles from './ElementosPanel.module.scss'

interface ElementosPanelProps {
  feature: FeatureAlcance
  catalogo: Catalogo
  guardando: boolean
  mutar: (accion: () => Promise<void>) => Promise<void>
}

/**
 * Eje 3: de qué está hecha la feature.
 *
 * Selección múltiple sobre el catálogo IFPUG. Cada elemento marcado lleva su
 * cantidad y su complejidad, y aporta puntos función con los pesos oficiales.
 */
export function ElementosPanel({
  feature,
  catalogo,
  guardando,
  mutar,
}: ElementosPanelProps) {
  if (!feature.categoria) {
    return (
      <div className={styles.panel}>
        <p className={styles.aviso}>
          Clasifica primero la feature: la categoría determina qué elementos se ofrecen.
        </p>
      </div>
    )
  }

  const disponibles = elementosDisponibles(catalogo, feature.categoria)
  const porClave = new Map(feature.elementos.map((e) => [e.elemento, e]))

  const puntosTotales = feature.elementos.reduce((total, sel) => {
    const def = catalogo.elementos.find((e) => e.clave === sel.elemento)
    return def ? total + sel.cantidad * puntosDeElemento(def, sel.complejidad) : total
  }, 0)

  const grupos = [...new Set(disponibles.map((e) => e.categoria))]

  return (
    <div className={styles.panel}>
      {grupos.map((grupo) => (
        <div key={grupo}>
          <p className={styles.grupo}>
            {grupo === 'transversal'
              ? 'Transversales — aplican a cualquier feature'
              : catalogo.categorias.find((c) => c.clave === grupo)?.nombre}
          </p>
          <div className={styles.rejilla}>
            {disponibles
              .filter((e) => e.categoria === grupo)
              .map((elemento) => {
                const sel = porClave.get(elemento.clave)
                const puntos = sel
                  ? sel.cantidad * puntosDeElemento(elemento, sel.complejidad)
                  : elemento.pfMedia

                return (
                  <div
                    key={elemento.clave}
                    className={cx(styles.elemento, sel && styles.elementoActivo)}
                  >
                    <Checkbox
                      id={`el-${feature.id}-${elemento.clave}`}
                      labelText={elemento.nombre}
                      checked={Boolean(sel)}
                      disabled={guardando}
                      onChange={(_e, { checked }) =>
                        void mutar(() =>
                          checked
                            ? marcarElemento(feature.id, elemento.clave)
                            : desmarcarElemento(feature.id, elemento.clave),
                        )
                      }
                    />
                    <span className={styles.ayuda}>{elemento.descripcion}</span>

                    {sel ? (
                      <div className={styles.controles}>
                        <div className={styles.control}>
                          <NumberInput
                            id={`cant-${feature.id}-${elemento.clave}`}
                            size="sm"
                            label="Cantidad"
                            min={1}
                            max={99}
                            value={sel.cantidad}
                            disabled={guardando}
                            invalidText="Mínimo 1."
                            onBlur={(e) => {
                              const v = Number((e.target as HTMLInputElement).value)
                              if (!Number.isFinite(v) || v < 1 || v === sel.cantidad) return
                              void mutar(() =>
                                ajustarElemento(feature.id, elemento.clave, { cantidad: v }),
                              )
                            }}
                          />
                        </div>
                        <div className={styles.control}>
                          <Select
                            id={`cplx-el-${feature.id}-${elemento.clave}`}
                            size="sm"
                            labelText="Complejidad"
                            value={sel.complejidad}
                            disabled={guardando}
                            onChange={(e) =>
                              void mutar(() =>
                                ajustarElemento(feature.id, elemento.clave, {
                                  complejidad: e.target.value as NivelComplejidad,
                                }),
                              )
                            }
                          >
                            {NIVELES_COMPLEJIDAD.map((n) => (
                              <SelectItem key={n} value={n} text={ETIQUETA_COMPLEJIDAD[n]} />
                            ))}
                          </Select>
                        </div>
                        <span className={styles.puntos}>{puntos} PF</span>
                      </div>
                    ) : (
                      <Tag type="warm-gray" size="sm">
                        {ETIQUETA_FP[elemento.tipoFp]} · {elemento.pfSimple}/
                        {elemento.pfMedia}/{elemento.pfAlta} PF
                      </Tag>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      ))}

      <p className={styles.total}>
        {feature.elementos.length} elemento(s) marcado(s) ·{' '}
        <strong>{puntosTotales} puntos función</strong> sin ajustar
      </p>
    </div>
  )
}
