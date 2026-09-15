import { Button, TextInput } from '@carbon/react'
import { useState } from 'react'

import { useApiToken } from '../model/use-api-token'

import styles from './ApiTokenField.module.scss'

/** Lee el `sub` del JWT sin validarlo: es solo para mostrar quién está conectado. */
function sujetoDelToken(token: string): string {
  try {
    const carga = JSON.parse(atob(token.split('.')[1])) as { sub?: string; role?: string }
    return [carga.sub, carga.role].filter(Boolean).join(' · ')
  } catch {
    return 'token no legible'
  }
}

export function ApiTokenField() {
  const { token, guardar, hayToken, esDelEntorno } = useApiToken()
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState('')

  // Con token cargado y sin ganas de cambiarlo, no se pide nada: solo se informa.
  if (hayToken && !editando) {
    return (
      <div className={styles.conectado}>
        <span className={styles.punto} aria-hidden="true" />
        <span className={styles.estado}>Conectado a Postgres</span>
        <span className={styles.detalle}>
          {sujetoDelToken(token)}
          {esDelEntorno ? ' · precargado del entorno' : ' · sesión de este navegador'}
        </span>
        <span className={styles.espaciador} />
        <Button kind="ghost" size="sm" type="button" onClick={() => setEditando(true)}>
          Cambiar token
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.fila}>
      <div className={styles.campo}>
        <TextInput
          id="api-token"
          type="password"
          labelText="Token de PostgREST"
          helperText="Genéralo con: npm run token"
          placeholder="eyJhbGciOi..."
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
        />
      </div>
      <Button
        type="button"
        size="md"
        disabled={!borrador.trim()}
        onClick={() => {
          guardar(borrador)
          setBorrador('')
          setEditando(false)
        }}
      >
        Conectar
      </Button>
      {editando ? (
        <>
          <Button
            kind="tertiary"
            size="md"
            type="button"
            onClick={() => {
              setBorrador('')
              setEditando(false)
            }}
          >
            Cancelar
          </Button>
          {!esDelEntorno ? (
            <Button
              kind="ghost"
              size="md"
              type="button"
              onClick={() => {
                guardar('')
                setBorrador('')
                setEditando(false)
              }}
            >
              Volver al token del entorno
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
