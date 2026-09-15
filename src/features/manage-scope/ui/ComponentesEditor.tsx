import {
  Button,
  Checkbox,
  NumberInput,
  Select,
  SelectItem,
  TextInput,
} from "@carbon/react";
import { useState } from "react";

import { ETIQUETA_TIPO, TIPOS_COMPONENTE } from "@/entities/estimation-model";
import type {
  StackTecnologico,
  TipoComponente,
} from "@/entities/estimation-model";
import {
  actualizarComponente,
  crearComponente,
  eliminarComponente,
} from "@/entities/project-scope";
import type { AlcanceDeProyecto } from "@/entities/project-scope";

import { CampoConAyuda } from "@/shared/ui";

import styles from "./editor.module.scss";

const STACKS: ReadonlyArray<{ valor: StackTecnologico; texto: string }> = [
  { valor: "net8", texto: ".NET 8 / Core" },
  { valor: "netcore", texto: ".NET Core" },
  { valor: "netfx", texto: ".NET Framework 4.x" },
  { valor: "angular17", texto: "Angular 15+" },
  { valor: "angular12", texto: "Angular ≤ 12" },
  { valor: "cobol", texto: "COBOL" },
  { valor: "otro-3gl", texto: "Otro 3GL (PL/1, RPG, Natural)" },
];

interface ComponentesEditorProps {
  alcance: AlcanceDeProyecto;
  guardando: boolean;
  mutar: (accion: () => Promise<void>) => Promise<void>;
}

export function ComponentesEditor({
  alcance,
  guardando,
  mutar,
}: ComponentesEditorProps) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoComponente>("micro-negocio");
  const [stack, setStack] = useState<StackTecnologico>("net8");
  const [esNuevo, setEsNuevo] = useState(true);

  const agregar = async () => {
    if (nombre.trim().length < 2) return;
    await mutar(() =>
      crearComponente(alcance.proyectoId, { nombre, tipo, stack, esNuevo }),
    );
    setNombre("");
  };

  return (
    <div className={styles.bloque}>
      <h4 className={styles.titulo}>
        Componentes ({alcance.componentes.length})
      </h4>

      {alcance.componentes.length === 0 ? (
        <p className={styles.vacio}>
          Sin componentes no hay streams, y sin streams no hay ruta crítica.
          Empieza aquí.
        </p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Stack</th>
                <th>Nuevo</th>
                <th className={styles.numero}>Máx. devs</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {alcance.componentes.map((componente) => (
                <tr key={componente.id}>
                  <td>{componente.nombre}</td>
                  <td>
                    <Select
                      id={`tipo-${componente.id}`}
                      size="sm"
                      labelText=""
                      hideLabel
                      value={componente.tipo}
                      disabled={guardando}
                      onChange={(e) =>
                        void mutar(() =>
                          actualizarComponente(componente.id, {
                            tipo: e.target.value as TipoComponente,
                          }),
                        )
                      }
                    >
                      {TIPOS_COMPONENTE.map((t) => (
                        <SelectItem key={t} value={t} text={ETIQUETA_TIPO[t]} />
                      ))}
                    </Select>
                  </td>
                  <td>
                    <Select
                      id={`stack-${componente.id}`}
                      size="sm"
                      labelText=""
                      hideLabel
                      value={componente.stack}
                      disabled={guardando}
                      onChange={(e) =>
                        void mutar(() =>
                          actualizarComponente(componente.id, {
                            stack: e.target.value as StackTecnologico,
                          }),
                        )
                      }
                    >
                      {STACKS.map((s) => (
                        <SelectItem
                          key={s.valor}
                          value={s.valor}
                          text={s.texto}
                        />
                      ))}
                    </Select>
                  </td>
                  <td>
                    <Checkbox
                      id={`nuevo-${componente.id}`}
                      labelText=""
                      hideLabel
                      checked={componente.esNuevo}
                      disabled={guardando}
                      onChange={(_e, { checked }) =>
                        void mutar(() =>
                          actualizarComponente(componente.id, {
                            esNuevo: checked,
                          }),
                        )
                      }
                    />
                  </td>
                  <td className={styles.numero}>
                    <NumberInput
                      id={`cap-${componente.id}`}
                      size="sm"
                      label=""
                      hideLabel
                      hideSteppers
                      // Vacío significa «usa el tope del tipo». Sin esto Carbon
                      // lo valida contra min={1} y pinta la fila en rojo.
                      allowEmpty
                      min={1}
                      max={10}
                      placeholder="auto"
                      value={componente.capDevs ?? ""}
                      disabled={guardando}
                      invalidText="Entre 1 y 10."
                      onBlur={(e) => {
                        const bruto = (
                          e.target as HTMLInputElement
                        ).value.trim();
                        const valor = bruto === "" ? null : Number(bruto);
                        if (valor !== null && (valor < 1 || valor > 10)) return;
                        if (valor === (componente.capDevs ?? null)) return;
                        void mutar(() =>
                          actualizarComponente(componente.id, {
                            capDevs: valor,
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
                        void mutar(() => eliminarComponente(componente.id))
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
            ayuda="Cómo llamáis a este sistema en la organización."
            efecto="Ninguno sobre el cálculo; identifica el frente de trabajo."
          >
            <TextInput
              id="nuevo-componente-nombre"
              size="sm"
              labelText="Nombre"
              placeholder="Micro core cuentas"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </CampoConAyuda>
        </div>
        <div className={styles.campo}>
          <CampoConAyuda
            ayuda="Qué clase de componente es. Un micro core es dueño del dato y tiene requisitos no funcionales altos; un BFF solo agrega y mapea."
            efecto="Fija las horas base por feature (BFF 20 h, micro core 60 h, 3GL 72 h) y el máximo de devs que caben en él."
          >
            <Select
              id="nuevo-componente-tipo"
              size="sm"
              labelText="Tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoComponente)}
            >
              {TIPOS_COMPONENTE.map((t) => (
                <SelectItem key={t} value={t} text={ETIQUETA_TIPO[t]} />
              ))}
            </Select>
          </CampoConAyuda>
        </div>
        <div className={styles.campo}>
          <CampoConAyuda
            ayuda="Con qué está construido. COBOL y otros 3GL rinden mucho menos por unidad de funcionalidad."
            efecto="Multiplica las horas: .NET 8 ×1.0, .NET Framework ×1.3, COBOL ×2.6 (medido sobre datos reales)."
          >
            <Select
              id="nuevo-componente-stack"
              size="sm"
              labelText="Stack"
              value={stack}
              onChange={(e) => setStack(e.target.value as StackTecnologico)}
            >
              {STACKS.map((s) => (
                <SelectItem key={s.valor} value={s.valor} text={s.texto} />
              ))}
            </Select>
          </CampoConAyuda>
        </div>
        <CampoConAyuda
          ayuda="Si hay que crearlo desde cero, frente a modificar uno que ya existe."
          efecto="Añade un coste único de arranque: pipeline, observabilidad y plantilla de pruebas."
        >
          <Checkbox
            id="nuevo-componente-nuevo"
            labelText="Componente nuevo"
            checked={esNuevo}
            onChange={(_e, { checked }) => setEsNuevo(checked)}
          />
        </CampoConAyuda>
        <Button
          size="sm"
          type="button"
          disabled={guardando || nombre.trim().length < 2}
          onClick={() => void agregar()}
        >
          Agregar
        </Button>
      </div>
    </div>
  );
}
