import {
  Button,
  Checkbox,
  NumberInput,
  Select,
  SelectItem,
  TextInput,
} from "@carbon/react";
import { useState } from "react";

import {
  ETIQUETA_COMPLEJIDAD,
  NIVELES_COMPLEJIDAD,
} from "@/entities/estimation-model";
import type { NivelComplejidad } from "@/entities/estimation-model";
import {
  actualizarIntegracion,
  crearIntegracion,
  eliminarIntegracion,
} from "@/entities/project-scope";
import type { AlcanceDeProyecto } from "@/entities/project-scope";

import { CampoConAyuda } from "@/shared/ui";

import styles from "./editor.module.scss";

interface IntegracionesEditorProps {
  alcance: AlcanceDeProyecto;
  guardando: boolean;
  mutar: (accion: () => Promise<void>) => Promise<void>;
}

export function IntegracionesEditor({
  alcance,
  guardando,
  mutar,
}: IntegracionesEditorProps) {
  const [nombre, setNombre] = useState("");
  const [complejidad, setComplejidad] = useState<NivelComplejidad>("m");
  const [duenio, setDuenio] = useState("");
  const [esExterna, setEsExterna] = useState(false);
  const [tieneSandbox, setTieneSandbox] = useState(true);
  const [usos, setUsos] = useState(1);

  const sinComponentes = alcance.componentes.length === 0;
  const componenteDuenio = duenio || alcance.componentes[0]?.id || "";

  const agregar = async () => {
    if (nombre.trim().length < 2 || !componenteDuenio) return;
    await mutar(() =>
      crearIntegracion(alcance.proyectoId, {
        nombre,
        complejidad,
        componenteDuenioId: componenteDuenio,
        esExterna,
        tieneSandbox,
        usos,
      }),
    );
    setNombre("");
    setUsos(1);
  };

  return (
    <div className={styles.bloque}>
      <h4 className={styles.titulo}>
        Integraciones ({alcance.integraciones.length})
      </h4>

      {alcance.integraciones.length === 0 ? (
        <p className={styles.vacio}>
          El recargo por contraparte externa (×1.4) y por falta de sandbox
          (×1.3) es lo que más se subestima: no es código, es coordinación y
          bloqueos.
        </p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Integración</th>
                <th>Complejidad</th>
                <th>Componente que la consume</th>
                <th>Externa</th>
                <th>Sandbox</th>
                <th className={styles.numero}>Usos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {alcance.integraciones.map((integracion) => (
                <tr key={integracion.id}>
                  <td>{integracion.nombre}</td>
                  <td>
                    <Select
                      id={`int-cplx-${integracion.id}`}
                      size="sm"
                      labelText=""
                      hideLabel
                      value={integracion.complejidad}
                      disabled={guardando}
                      onChange={(e) =>
                        void mutar(() =>
                          actualizarIntegracion(integracion.id, {
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
                    <Select
                      id={`int-duenio-${integracion.id}`}
                      size="sm"
                      labelText=""
                      hideLabel
                      value={integracion.componenteDuenioId}
                      disabled={guardando}
                      onChange={(e) =>
                        void mutar(() =>
                          actualizarIntegracion(integracion.id, {
                            componenteDuenioId: e.target.value,
                          }),
                        )
                      }
                    >
                      {alcance.componentes.map((c) => (
                        <SelectItem key={c.id} value={c.id} text={c.nombre} />
                      ))}
                    </Select>
                  </td>
                  <td>
                    <Checkbox
                      id={`int-ext-${integracion.id}`}
                      labelText=""
                      hideLabel
                      checked={integracion.esExterna}
                      disabled={guardando}
                      onChange={(_e, { checked }) =>
                        void mutar(() =>
                          actualizarIntegracion(integracion.id, {
                            esExterna: checked,
                          }),
                        )
                      }
                    />
                  </td>
                  <td>
                    <Checkbox
                      id={`int-sbx-${integracion.id}`}
                      labelText=""
                      hideLabel
                      checked={integracion.tieneSandbox}
                      disabled={guardando}
                      onChange={(_e, { checked }) =>
                        void mutar(() =>
                          actualizarIntegracion(integracion.id, {
                            tieneSandbox: checked,
                          }),
                        )
                      }
                    />
                  </td>
                  <td className={styles.numero}>
                    <NumberInput
                      id={`int-usos-${integracion.id}`}
                      size="sm"
                      label=""
                      hideLabel
                      hideSteppers
                      min={1}
                      max={99}
                      value={integracion.usos}
                      disabled={guardando}
                      invalidText="Mínimo 1."
                      onBlur={(e) => {
                        const valor = Number(
                          (e.target as HTMLInputElement).value,
                        );
                        if (!Number.isFinite(valor) || valor < 1) return;
                        if (valor === integracion.usos) return;
                        void mutar(() =>
                          actualizarIntegracion(integracion.id, {
                            usos: valor,
                          }),
                        );
                      }}
                    />
                  </td>
                  <td className={styles.acciones}>
                    <Button
                      kind="ghost"
                      size="sm"
                      type="button"
                      disabled={guardando}
                      onClick={() =>
                        void mutar(() => eliminarIntegracion(integracion.id))
                      }
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.altaForm}>
        <div className={`${styles.campo} ${styles.campoAncho}`}>
          <CampoConAyuda
            ayuda="Con qué sistema hay que hablar."
            efecto="Ninguno sobre el cálculo."
          >
            <TextInput
              id="nueva-int-nombre"
              size="sm"
              labelText="Nombre"
              placeholder="Core bancario (SOAP)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </CampoConAyuda>
        </div>
        <div className={styles.campo}>
          <CampoConAyuda
            ayuda="Baja: REST interno con contrato estable. Muy alta: core bancario, mainframe o certificación con un tercero."
            efecto="Fija las horas base: baja 8 h, media 24 h, alta 56 h, muy alta 96 h."
          >
            <Select
              id="nueva-int-complejidad"
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
        <div className={styles.campo}>
          <CampoConAyuda
            ayuda="Qué componente tuyo se conecta con ese sistema."
            efecto="Su esfuerzo entra en el frente de trabajo de ese componente, y puede volverlo ruta crítica."
          >
            <Select
              id="nueva-int-duenio"
              size="sm"
              labelText="La consume"
              value={componenteDuenio}
              disabled={sinComponentes}
              onChange={(e) => setDuenio(e.target.value)}
            >
              {alcance.componentes.map((c) => (
                <SelectItem key={c.id} value={c.id} text={c.nombre} />
              ))}
            </Select>
          </CampoConAyuda>
        </div>
        <div className={styles.campo}>
          <CampoConAyuda
            ayuda="Cuántas features tiran de esta integración."
            efecto="La primera cuesta completa; cada una adicional suma un 25 %, porque se reaprovecha pero no sale gratis."
          >
            <NumberInput
              id="nueva-int-usos"
              size="sm"
              label="Features que la usan"
              min={1}
              max={99}
              value={usos}
              onChange={(_e, { value }) =>
                setUsos(Math.max(1, Number(value) || 1))
              }
            />
          </CampoConAyuda>
        </div>
        <div className={styles.casillas}>
          <CampoConAyuda
            ayuda="Si el sistema lo controla alguien fuera de tu organización."
            efecto="Multiplica ×1.4. No es más código: es coordinación, esperas y ventanas de prueba ajenas."
          >
            <Checkbox
              id="nueva-int-externa"
              labelText="Contraparte externa (×1.4)"
              checked={esExterna}
              onChange={(_e, { checked }) => setEsExterna(checked)}
            />
          </CampoConAyuda>
          <CampoConAyuda
            ayuda="Si puedes probar contra un entorno del tercero o un simulador fiable."
            efecto="Sin sandbox multiplica ×1.3: se desarrolla a ciegas y se corrige en integración."
          >
            <Checkbox
              id="nueva-int-sandbox"
              labelText="Hay sandbox o mock"
              checked={tieneSandbox}
              onChange={(_e, { checked }) => setTieneSandbox(checked)}
            />
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
      </div>
    </div>
  );
}
