import { Link, Outlet } from 'react-router'

import { AppHeader } from '@/widgets/app-header'

import styles from './Layout.module.scss'

/** Marco común de todas las rutas: cabecera fija y contenido. */
export function Layout() {
  return (
    <>
      <AppHeader />
      <main className={styles.contenido}>
        <Outlet />
      </main>
    </>
  )
}

export function NoEncontrado() {
  return (
    <>
      <h1 className={styles.titulo}>Esta página no existe</h1>
      <p className={styles.noEncontrado}>
        Vuelve a <Link to="/">Proyectos</Link>.
      </p>
    </>
  )
}
