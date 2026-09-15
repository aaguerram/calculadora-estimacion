import {
  Button,
  InlineNotification,
  NumberInput,
  Select,
  SelectItem,
  TextInput,
} from "@carbon/react";
import type { FormEvent } from "react";

import type { NivelCompromiso } from "@/entities/estimation-project";

import { esEnviable, horasMesHombre } from "../model/create-project.reducer";
import { useCreateEstimationProject } from "../model/use-create-estimation-project";

import { CampoConAyuda } from "@/shared/ui";

import styles from "./CreateEstimationProjectForm.module.scss";

interface CreateEstimationProjectFormProps {
  alCrear?: () => void;
  /** Recibe el id del proyecto recien creado, para poder continuar con el. */
  alCrearConId?: (proyectoId: string) => void;
}

/**
 * Vista del feature: traduce eventos a intents y muestra el estado.
 * Toda la validacion vive en `esEnviable`, funcion pura del reducer.
 */
export function CreateEstimationProjectForm({
  alCrear,
  alCrearConId,
}: CreateEstimationProjectFormProps) {
  const { state, dispatch, enviar } = useCreateEstimationProject(
    alCrear,
    alCrearConId,
  );

  const onSubmit = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    void enviar();
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <CampoConAyuda
        ayuda="Cómo se llama el trabajo que vas a estimar. Solo identifica el proyecto."
        efecto="Ninguno sobre el cálculo."
      >
        <TextInput
          id="proyecto-nombre"
          labelText="Nombre del proyecto"
          placeholder="Banca digital — fase 1"
          value={state.nombre}
          invalid={state.nombre.length > 0 && state.nombre.trim().length < 3}
          invalidText="Mínimo 3 caracteres."
          onChange={(e) =>
            dispatch({ type: "nombreCambiado", valor: e.target.value })
          }
        />
      </CampoConAyuda>

      <CampoConAyuda
        ayuda="Para quién es. Sirve para encontrarlo después entre varios proyectos."
        efecto="Ninguno sobre el cálculo."
      >
        <TextInput
          id="proyecto-cliente"
          labelText="Cliente (opcional)"
          value={state.cliente}
          onChange={(e) =>
            dispatch({ type: "clienteCambiado", valor: e.target.value })
          }
        />
      </CampoConAyuda>

      <div className={styles.rejilla}>
        <CampoConAyuda
          ayuda="Horas PRODUCTIVAS al día, no las de contrato: reuniones, soporte e interrupciones ya están descontadas."
          efecto="Define cuánto vale un mes-hombre. Menos horas = más meses-hombre para el mismo trabajo."
        >
          <NumberInput
            id="proyecto-horas-dia"
            label="Horas por día"
            min={1}
            max={12}
            step={0.5}
            value={state.horasDia}
            invalidText="Entre 1 y 12."
            onChange={(_e, { value }) =>
              dispatch({ type: "horasDiaCambiadas", valor: Number(value) || 0 })
            }
          />
        </CampoConAyuda>
        <CampoConAyuda
          ayuda="Días laborables al mes, descontando festivos y vacaciones promedio."
          efecto="Con 6 h × 20 días un mes-hombre son 120 h. Cambiarlo reescala todas las cifras de esfuerzo."
        >
          <NumberInput
            id="proyecto-dias-mes"
            label="Días por mes"
            min={1}
            max={31}
            value={state.diasMes}
            invalidText="Entre 1 y 31."
            onChange={(_e, { value }) =>
              dispatch({ type: "diasMesCambiados", valor: Number(value) || 0 })
            }
          />
        </CampoConAyuda>
        <CampoConAyuda
          ayuda="Qué probabilidad quieres de NO pasarte. P80 significa que 8 de cada 10 veces el trabajo cabe en la cifra."
          efecto="P50 es la mediana y se incumple la mitad de las veces. P90 para precio fijo; P80 es el equilibrio habitual."
        >
          <Select
            id="proyecto-compromiso"
            labelText="Percentil comprometido"
            value={String(state.nivelCompromiso)}
            onChange={(e) =>
              dispatch({
                type: "compromisoCambiado",
                valor: Number(e.target.value) as NivelCompromiso,
              })
            }
          >
            <SelectItem value="50" text="P50 — time & materials" />
            <SelectItem value="80" text="P80 — recomendado" />
            <SelectItem value="90" text="P90 — precio fijo" />
          </Select>
        </CampoConAyuda>
      </div>

      <p className={styles.jornada}>
        1 mes-hombre = <strong>{horasMesHombre(state)} h</strong>
      </p>

      {state.error ? (
        <InlineNotification
          kind="error"
          lowContrast
          title="No se pudo guardar"
          subtitle={state.error}
          onCloseButtonClick={() => dispatch({ type: "avisoCerrado" })}
        />
      ) : null}

      {state.ultimoCreado ? (
        <InlineNotification
          kind="success"
          lowContrast
          title="Guardado en Postgres"
          subtitle={`«${state.ultimoCreado}» quedó registrado.`}
          onCloseButtonClick={() => dispatch({ type: "avisoCerrado" })}
        />
      ) : null}

      <div className={styles.acciones}>
        <Button type="submit" disabled={!esEnviable(state)}>
          {state.enviando ? "Guardando…" : "Crear proyecto"}
        </Button>
      </div>
    </form>
  );
}
