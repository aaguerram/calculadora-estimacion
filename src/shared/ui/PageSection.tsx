import type { ReactNode } from 'react'

import { cx } from '@/shared/lib'

import styles from './PageSection.module.scss'

interface PageSectionProps {
  title: string
  description?: string
  className?: string
  children: ReactNode
}

/**
 * Contenedor visual generico. Vive en `shared/ui` porque no sabe nada
 * del dominio: cualquier capa superior puede reutilizarlo.
 */
export function PageSection({ title, description, className, children }: PageSectionProps) {
  return (
    <section className={cx(styles.section, className)}>
      <h2 className={styles.title}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
    </section>
  )
}
