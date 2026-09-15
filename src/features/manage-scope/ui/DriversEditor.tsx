import { RadioButton, RadioButtonGroup } from "@carbon/react";

import {
  CATALOGO_DRIVERS,
  ETIQUETA_POSTURA,
  fijarDriver,
  posturaDeDelta,
} from "@/entities/project-scope";
import type {
  AlcanceDeProyecto,
  PosturaDriver,
} from "@/entities/project-scope";

import styles from "./editor.module.scss";

const POSTURAS: readonly PosturaDriver[] = ["favorable", "nominal", "adverso"];

interface DriversEditorProps {
  alcance: AlcanceDeProyecto;
  guardando: boolean;
  mutar: (accion: () => Promise<void>) => Promise<void>;
}

export function DriversEditor({
  alcance,
  guardando,
  mutar,
}: DriversEditorProps) {
  const factor = 1 + alcance.drivers.reduce((t, d) => t + d.delta, 0);

  return (
    <div className={styles.bloque}>
      <h4 className={styles.titulo}>Drivers del proyecto</h4>

      {CATALOGO_DRIVERS.map((definicion) => {
        const guardado = alcance.drivers.find(
          (d) => d.clave === definicion.clave,
        );
        const delta = guardado?.delta ?? definicion.valores.nominal;
        const postura = posturaDeDelta(definicion, delta);

        return (
          <div key={definicion.clave} className={styles.driver}>
            <div className={styles.driverCabecera}>
              <span className={styles.driverEtiqueta}>
                {definicion.etiqueta}
              </span>
              <span className={styles.driverDelta}>
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(2)}
              </span>
            </div>
            <span className={styles.driverAyuda}>{definicion.ayuda}</span>
            <RadioButtonGroup
              legendText=""
              name={`driver-${definicion.clave}`}
              valueSelected={postura}
              disabled={guardando}
              onChange={(valor) =>
                void mutar(() =>
                  fijarDriver(
                    alcance.proyectoId,
                    definicion.clave,
                    definicion.valores[valor as PosturaDriver],
                  ),
                )
              }
            >
              {POSTURAS.map((p) => (
                <RadioButton
                  key={p}
                  id={`driver-${definicion.clave}-${p}`}
                  value={p}
                  labelText={`${ETIQUETA_POSTURA[p]} (${definicion.valores[p] >= 0 ? "+" : ""}${definicion.valores[p].toFixed(2)})`}
                />
              ))}
            </RadioButtonGroup>
          </div>
        );
      })}

      <p className={styles.factor}>
        Factor de proyecto: <strong>×{factor.toFixed(2)}</strong> — los deltas
        se <strong>suman</strong>. Multiplicarlos produciría ×
        {alcance.drivers.reduce((t, d) => t * (1 + d.delta), 1).toFixed(2)} con
        las mismas respuestas, que es como se infla una estimación paramétrica.
      </p>
    </div>
  );
}
