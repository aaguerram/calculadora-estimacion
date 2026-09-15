import {
  ETIQUETA_TIPO,
  NIVELES_COMPLEJIDAD,
  TIPOS_COMPONENTE,
} from "@/entities/estimation-model";
import type {
  CoeficientesModelo,
  NivelComplejidad,
  TipoComponente,
} from "@/entities/estimation-model";
import type {
  CoeficienteAEscribir,
  PropuestaCalibracion,
} from "@/entities/historical-project";

export interface CambioCoeficiente {
  clave: string;
  etiqueta: string;
  valorActual: number;
  valorPropuesto: number;
  variacion: number;
  confianza: "alta" | "media" | "baja";
}

const esTipo = (v: string): v is TipoComponente =>
  (TIPOS_COMPONENTE as readonly string[]).includes(v);

/** Redondeo a 2 decimales: no tiene sentido guardar 47.83271 horas base. */
const redondear = (v: number) => Math.round(v * 100) / 100;

/**
 * Traduce una propuesta estadistica en cambios concretos de coeficientes.
 *
 * Hay que tocar TODO lo que alimenta el esfuerzo de un bucket, no solo las horas
 * base. El esfuerzo de un componente es `features x base + arranque + integraciones`,
 * asi que escalar unicamente `base.<tipo>` corrige apenas la mitad del sesgo: en el
 * alcance de referencia los arranques y las integraciones son ~la mitad del total.
 *
 * - `base.<tipo>` y `bootstrap.<tipo>`  -> factor del bucket (van juntos, mismo stream).
 * - `integracion.<nivel>`               -> factor GLOBAL: las integraciones se
 *   indexan por complejidad, no por tipo de componente.
 *
 * Los ajustes de confianza baja se descartan: mover un coeficiente con uno o dos
 * proyectos es ruido disfrazado de calibracion.
 */
/** Por debajo de esta fraccion el historico no ejercita los puntos funcion. */
export const MINIMO_PARA_CALIBRAR_PF = 0.2;

export function construirCambios(
  coeficientes: CoeficientesModelo,
  propuesta: PropuestaCalibracion,
  /** Cuanto del historico se midio por puntos funcion (0..1). */
  fraccionPorPuntos = 0,
): CambioCoeficiente[] {
  const cambios: CambioCoeficiente[] = [];

  const agregar = (
    clave: string,
    etiqueta: string,
    actual: number,
    factor: number,
    confianza: CambioCoeficiente["confianza"],
  ) => {
    if (!(actual > 0)) return;
    const propuesto = redondear(actual * factor);
    if (propuesto === actual) return;
    cambios.push({
      clave,
      etiqueta,
      valorActual: actual,
      valorPropuesto: propuesto,
      variacion: propuesto / actual - 1,
      confianza,
    });
  };

  for (const ajuste of propuesta.ajustes) {
    if (!esTipo(ajuste.clave) || ajuste.confianza === "baja") continue;
    const tipo = ajuste.clave;
    agregar(
      `base.${tipo}`,
      `Horas base · ${ETIQUETA_TIPO[tipo]}`,
      coeficientes.base[tipo],
      ajuste.factor,
      ajuste.confianza,
    );
    agregar(
      `bootstrap.${tipo}`,
      `Arranque · ${ETIQUETA_TIPO[tipo]}`,
      coeficientes.bootstrap[tipo],
      ajuste.factor,
      ajuste.confianza,
    );
  }

  // Las horas por punto funcion tampoco cuelgan de un tipo de componente: el
  // esfuerzo medido por PF no pasa por `base.<tipo>`, asi que escalar aquellos
  // no lo corrige. Solo se propone si el historico de verdad usa puntos funcion.
  if (
    fraccionPorPuntos >= MINIMO_PARA_CALIBRAR_PF &&
    Math.abs(propuesta.factorGlobal - 1) >= 0.03
  ) {
    agregar(
      "pf.horas-por-punto",
      "Horas de desarrollo por punto función",
      coeficientes.puntosFuncion.horasDevPorPunto,
      propuesta.factorGlobal,
      fraccionPorPuntos >= 0.6 ? "alta" : "media",
    );
  }

  // Las integraciones no pertenecen a un tipo: se ajustan con el factor global.
  if (Math.abs(propuesta.factorGlobal - 1) >= 0.03) {
    for (const nivel of NIVELES_COMPLEJIDAD) {
      agregar(
        `integracion.${nivel}`,
        `Integración · complejidad ${nivel}`,
        coeficientes.integracion.porComplejidad[nivel],
        propuesta.factorGlobal,
        "media",
      );
    }
  }

  // El sigma del riesgo comun se mide directamente sobre los residuos: siempre
  // que haya muestra suficiente, es el coeficiente mas solido de recalibrar.
  const sigmaActual = coeficientes.riesgo.sigmaComun;
  const sigmaPropuesto = Math.round(propuesta.sigmaComun * 1000) / 1000;
  if (sigmaPropuesto > 0 && sigmaPropuesto !== sigmaActual) {
    cambios.push({
      clave: "riesgo.sigma-comun",
      etiqueta: "σ del riesgo común",
      valorActual: sigmaActual,
      valorPropuesto: sigmaPropuesto,
      variacion: sigmaActual > 0 ? sigmaPropuesto / sigmaActual - 1 : 0,
      confianza: "alta",
    });
  }

  return cambios;
}

/** Aplica los cambios sobre una copia, para poder re-hacer el backtest antes de guardar. */
export function simularCambios(
  coeficientes: CoeficientesModelo,
  cambios: readonly CambioCoeficiente[],
): CoeficientesModelo {
  const resultado: CoeficientesModelo = {
    ...coeficientes,
    base: { ...coeficientes.base },
    bootstrap: { ...coeficientes.bootstrap },
    integracion: {
      ...coeficientes.integracion,
      porComplejidad: { ...coeficientes.integracion.porComplejidad },
    },
    riesgo: { ...coeficientes.riesgo },
    puntosFuncion: { ...coeficientes.puntosFuncion },
  };

  for (const cambio of cambios) {
    const [grupo, sub] = [
      cambio.clave.slice(0, cambio.clave.indexOf(".")),
      cambio.clave.slice(cambio.clave.indexOf(".") + 1),
    ];
    if (grupo === "riesgo" && sub === "sigma-comun") {
      resultado.riesgo.sigmaComun = cambio.valorPropuesto;
    } else if (grupo === "pf" && sub === "horas-por-punto") {
      resultado.puntosFuncion.horasDevPorPunto = cambio.valorPropuesto;
    } else if (grupo === "base" && esTipo(sub)) {
      resultado.base[sub] = cambio.valorPropuesto;
    } else if (grupo === "bootstrap" && esTipo(sub)) {
      resultado.bootstrap[sub] = cambio.valorPropuesto;
    } else if (grupo === "integracion") {
      resultado.integracion.porComplejidad[sub as NivelComplejidad] =
        cambio.valorPropuesto;
    }
  }

  return resultado;
}

/** La unidad se deduce del prefijo de la clave; la tabla la exige no nula. */
export function unidadDeCoeficiente(clave: string): string {
  const grupo = clave.slice(0, clave.indexOf("."));
  switch (grupo) {
    case "base":
    case "bootstrap":
    case "integracion":
    // `pf.horas-por-punto` son horas, no un factor: sin esta rama el upsert
    // escribiria la unidad equivocada en la tabla.
    case "pf":
      return "horas";
    case "cap":
      return "devs";
    default:
      return "factor";
  }
}

/** Fila lista para escribir en `estimacion.modelo_coeficiente`. */
export function aFilaCoeficiente(
  cambio: CambioCoeficiente,
  proyectosUsados: number,
  fecha: Date = new Date(),
): CoeficienteAEscribir {
  return {
    clave: cambio.clave,
    valor: cambio.valorPropuesto,
    unidad: unidadDeCoeficiente(cambio.clave),
    descripcion: `${cambio.etiqueta} — recalibrado el ${fecha.toISOString().slice(0, 10)} con ${proyectosUsados} proyecto(s) cerrado(s)`,
  };
}
