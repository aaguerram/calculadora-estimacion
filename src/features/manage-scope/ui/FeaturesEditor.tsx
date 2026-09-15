import {
  Button,
  Checkbox,
  Select,
  SelectItem,
  Tag,
  TextInput,
} from "@carbon/react";
import { useState } from "react";

import {
  ETIQUETA_COMPLEJIDAD,
  NIVELES_COMPLEJIDAD,
} from "@/entities/estimation-model";
import type { NivelComplejidad } from "@/entities/estimation-model";
import { puntosDeElemento } from "@/entities/feature-catalog";
import type { Catalogo } from "@/entities/feature-catalog";
import {
  actualizarFeature,
  crearFeature,
  desvincularFeatureComponente,
  eliminarFeature,
  fijarCategoriaFeature,
  fijarComplejidadDelPar,
  vincularFeatureComponente,
} from "@/entities/project-scope";
import type {
  AlcanceDeProyecto,
  FeatureAlcance,
} from "@/entities/project-scope";

import { ElementosPanel } from "./ElementosPanel";
import { CampoConAyuda } from "@/shared/ui";

import styles from "./editor.module.scss";

interface FeaturesEditorProps {
  alcance: AlcanceDeProyecto;
  catalogo: Catalogo;
  /** Horas de desarrollo por punto función, del modelo calibrado. */
  horasPorPunto: number;
  guardando: boolean;
  mutar: (accion: () => Promise<void>) => Promise<void>;
}

export function FeaturesEditor({
  alcance,
  catalogo,
  horasPorPunto,
  guardando,
  mutar,
}: FeaturesEditorProps) {
  const [nombre, setNombre] = useState("");
  const [complejidad, setComplejidad] = useState<NivelComplejidad>("m");
  const [categoria, setCategoria] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);

  const pares = alcance.features.reduce((t, f) => t + f.toca.length, 0);
  const sinComponentes = alcance.componentes.length === 0;
  const sinClasificar = alcance.features.filter(
    (f) => f.categoria === null,
  ).length;

  const puntosDe = (feature: FeatureAlcance) =>
    feature.elementos.reduce((total, sel) => {
      const def = catalogo.elementos.find((e) => e.clave === sel.elemento);
      return def
        ? total + sel.cantidad * puntosDeElemento(def, sel.complejidad)
        : total;
    }, 0);

  const puntosTotales = alcance.features.reduce((t, f) => t + puntosDe(f), 0);

  const agregar = async () => {
    if (nombre.trim().length < 2) return;
    await mutar(async () => {
      await crearFeature(alcance.proyectoId, {
        nombre,
        complejidad,
        categoria: categoria || null,
        orden: alcance.features.length + 1,
      });
    });
    setNombre("");
  };

  return (
    <div className={styles.bloque}>
      <h4 className={styles.titulo}>
        Features ({alcance.features.length})
        <Tag type="warm-gray" size="sm">
          {pares} pares estimables
        </Tag>
        {puntosTotales > 0 ? (
          <Tag type="green" size="sm">
            {puntosTotales} PF × {horasPorPunto} h ={" "}
            {Math.round(puntosTotales * horasPorPunto)} h de desarrollo
          </Tag>
        ) : null}
        {sinClasificar > 0 ? (
          <Tag type="red" size="sm">
            {sinClasificar} sin clasificar
          </Tag>
        ) : null}
      </h4>

      {alcance.features.length === 0 ? (
        <p className={styles.vacio}>
          La unidad que se estima es el par (feature × componente), no la
          feature suelta. Marca abajo qué componentes toca cada una.
        </p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Categoría</th>
                <th>Complejidad</th>
                <th>Componentes que toca</th>
                <th>Elementos · medida</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {alcance.features.flatMap((feature) => [
                <tr key={feature.id}>
                  <td>{feature.nombre}</td>
                  <td>
                    <Select
                      id={`cat-${feature.id}`}
                      size="sm"
                      labelText=""
                      hideLabel
                      value={feature.categoria ?? ""}
                      disabled={guardando}
                      invalid={feature.categoria === null}
                      onChange={(e) =>
                        void mutar(() =>
                          fijarCategoriaFeature(
                            feature.id,
                            e.target.value || null,
                          ),
                        )
                      }
                    >
                      <SelectItem value="" text="— sin clasificar —" />
                      {catalogo.categorias
                        .filter((c) => c.clave !== "transversal")
                        .map((c) => (
                          <SelectItem
                            key={c.clave}
                            value={c.clave}
                            text={c.nombre}
                          />
                        ))}
                    </Select>
                  </td>
                  <td>
                    <Select
                      id={`cplx-${feature.id}`}
                      size="sm"
                      labelText=""
                      hideLabel
                      value={feature.complejidad}
                      disabled={guardando}
                      onChange={(e) =>
                        void mutar(() =>
                          actualizarFeature(feature.id, {
                            complejidad: e.target.value as NivelComplejidad,
                          }),
                        )
                      }
                    >
                      {NIVELES_COMPLEJIDAD.map((n) => (
                        <SelectItem
                          key={n}
                          value={n}
                          text={ETIQUETA_COMPLEJIDAD[n]}
                        />
                      ))}
                    </Select>
                  </td>
                  <td>
                    <div className={styles.pares}>
                      {alcance.componentes.map((componente) => {
                        const par = feature.toca.find(
                          (t) => t.componenteId === componente.id,
                        );
                        return (
                          <span
                            key={componente.id}
                            className={`${styles.par} ${par ? styles.parActivo : ""}`}
                          >
                            <Checkbox
                              id={`par-${feature.id}-${componente.id}`}
                              labelText={componente.nombre}
                              checked={Boolean(par)}
                              disabled={guardando}
                              onChange={(_e, { checked }) =>
                                void mutar(() =>
                                  checked
                                    ? vincularFeatureComponente(
                                        feature.id,
                                        componente.id,
                                      )
                                    : desvincularFeatureComponente(
                                        feature.id,
                                        componente.id,
                                      ),
                                )
                              }
                            />
                            {par ? (
                              <Select
                                id={`par-cplx-${feature.id}-${componente.id}`}
                                size="sm"
                                labelText=""
                                hideLabel
                                value={par.complejidad ?? ""}
                                disabled={guardando}
                                onChange={(e) =>
                                  void mutar(() =>
                                    fijarComplejidadDelPar(
                                      feature.id,
                                      componente.id,
                                      (e.target.value ||
                                        null) as NivelComplejidad | null,
                                    ),
                                  )
                                }
                              >
                                <SelectItem value="" text="hereda" />
                                {NIVELES_COMPLEJIDAD.map((n) => (
                                  <SelectItem
                                    key={n}
                                    value={n}
                                    text={ETIQUETA_COMPLEJIDAD[n]}
                                  />
                                ))}
                              </Select>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <Button
                      kind={abierta === feature.id ? "tertiary" : "ghost"}
                      size="sm"
                      type="button"
                      onClick={() =>
                        setAbierta(abierta === feature.id ? null : feature.id)
                      }
                    >
                      {puntosDe(feature) > 0
                        ? `${puntosDe(feature)} PF → ${Math.round(puntosDe(feature) * horasPorPunto)} h`
                        : "sin elementos"}
                    </Button>
                  </td>
                  <td className={styles.acciones}>
                    <Button
                      kind="ghost"
                      size="sm"
                      type="button"
                      disabled={guardando}
                      onClick={() =>
                        void mutar(() => eliminarFeature(feature.id))
                      }
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>,
                abierta === feature.id ? (
                  <tr key={`${feature.id}-elementos`}>
                    <td colSpan={6}>
                      <ElementosPanel
                        feature={feature}
                        catalogo={catalogo}
                        horasPorPunto={horasPorPunto}
                        guardando={guardando}
                        mutar={mutar}
                      />
                    </td>
                  </tr>
                ) : null,
              ])}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.altaForm}>
        <div className={`${styles.campo} ${styles.campoAncho}`}>
          <CampoConAyuda
            ayuda="Qué hace, en lenguaje de negocio. «Transferencia interna», no «endpoint POST /transfer»."
            efecto="Ninguno sobre el cálculo."
          >
            <TextInput
              id="nueva-feature-nombre"
              size="sm"
              labelText="Nombre de la feature"
              placeholder="Transferencia interna"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </CampoConAyuda>
        </div>
        <div className={styles.campo}>
          <CampoConAyuda
            ayuda="Qué clase de feature es: una pantalla, un reporte, un proceso batch, una API, una integración…"
            efecto="Determina qué elementos se te ofrecen después para describirla en detalle."
          >
            <Select
              id="nueva-feature-categoria"
              size="sm"
              labelText="Categoría"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <SelectItem value="" text="— sin clasificar —" />
              {catalogo.categorias
                .filter((c) => c.clave !== "transversal")
                .map((c) => (
                  <SelectItem key={c.clave} value={c.clave} text={c.nombre} />
                ))}
            </Select>
          </CampoConAyuda>
        </div>
        <div className={styles.campo}>
          <CampoConAyuda
            ayuda="Cuánta lógica tiene. Media es un flujo estándar con validaciones; muy alta es transaccionalidad distribuida o auditoría regulatoria."
            efecto="Multiplica las horas (muy baja ×0.4 … muy alta ×2.2). Si marcas elementos, manda el cálculo por puntos función."
          >
            <Select
              id="nueva-feature-complejidad"
              size="sm"
              labelText="Complejidad"
              value={complejidad}
              onChange={(e) =>
                setComplejidad(e.target.value as NivelComplejidad)
              }
            >
              {NIVELES_COMPLEJIDAD.map((n) => (
                <SelectItem key={n} value={n} text={ETIQUETA_COMPLEJIDAD[n]} />
              ))}
            </Select>
          </CampoConAyuda>
        </div>
        <Button
          size="sm"
          type="button"
          disabled={guardando || nombre.trim().length < 2 || sinComponentes}
          onClick={() => void agregar()}
        >
          Agregar
        </Button>
        {sinComponentes ? (
          <span className={styles.vacio}>Crea un componente antes.</span>
        ) : null}
      </div>
    </div>
  );
}
