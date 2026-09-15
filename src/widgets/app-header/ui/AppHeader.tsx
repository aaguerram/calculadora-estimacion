import { Link, NavLink } from 'react-router'

import { APP_CONFIG } from '@/shared/config'
import { cx } from '@/shared/lib'

import styles from './AppHeader.module.scss'

const SECCIONES = [
  { a: '/', texto: 'Proyectos', exacto: true },
  { a: '/ingresar', texto: 'Ingresar proyecto', exacto: false },
  { a: '/calibracion', texto: 'Calibración', exacto: false },
  { a: '/fuentes', texto: 'Fuentes', exacto: false },
]

/** Cabecera de navegación. Único sitio donde se declara el menú. */
export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.interior}>
        <Link to="/" className={styles.marca}>
          {APP_CONFIG.name}
          <span className={styles.marcaSufijo}>Esfuerzo · equipo óptimo · duración</span>
        </Link>

        <nav className={styles.nav}>
          {SECCIONES.map((s) => (
            <NavLink
              key={s.a}
              to={s.a}
              end={s.exacto}
              className={({ isActive }) => cx(styles.enlace, isActive && styles.activo)}
            >
              {s.texto}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
