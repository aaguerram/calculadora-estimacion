import { Toggletip, ToggletipButton, ToggletipContent } from '@carbon/react'
import { Information } from '@carbon/icons-react'
import type { ReactNode } from 'react'

import { cx } from '@/shared/lib'

import styles from './ConAyuda.module.scss'

interface CampoConAyudaProps {
  /** El control de Carbon al que acompaña. */
  children: ReactNode
  /** Qué es y para qué sirve el campo. */
  ayuda: ReactNode
  /** Qué le pasa a la estimación si lo cambias. */
  efecto?: ReactNode
  className?: string
}

/**
 * Envuelve un campo y le añade un desplegable de informacion.
 *
 *   <CampoConAyuda ayuda="..." efecto="...">
 *     <TextInput id="x" labelText="Nombre" ... />
 *   </CampoConAyuda>
 *
 * El disparador NO va dentro de `labelText`: Carbon lo rechaza porque un boton
 * dentro de un <label> es HTML invalido. Va superpuesto a la derecha del campo.
 *
 * Vive en `shared/ui` porque no sabe nada del dominio: recibe el texto.
 */
export function CampoConAyuda({ children, ayuda, efecto, className }: CampoConAyudaProps) {
  return (
    <div className={cx(styles.campo, className)}>
      <div className={styles.disparador}>
        <Toggletip align="top-right">
          <ToggletipButton label="Qué es este campo">
            <Information size={16} />
          </ToggletipButton>
          <ToggletipContent>
            <div className={styles.contenido}>
              <p>{ayuda}</p>
              {efecto ? <span className={styles.efecto}>Efecto: {efecto}</span> : null}
            </div>
          </ToggletipContent>
        </Toggletip>
      </div>
      {children}
    </div>
  )
}
