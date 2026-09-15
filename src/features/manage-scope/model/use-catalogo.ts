import { useCallback, useEffect, useState } from 'react'

import { CATALOGO_VACIO, cargarCatalogo } from '@/entities/feature-catalog'
import type { Catalogo } from '@/entities/feature-catalog'

/**
 * El catálogo de categorías y elementos es de lectura pública y casi inmutable.
 * Se carga una vez y se comparte con los editores.
 */
export function useCatalogo() {
  const [catalogo, setCatalogo] = useState<Catalogo>(CATALOGO_VACIO)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async (signal?: AbortSignal) => {
    try {
      const nuevo = await cargarCatalogo(signal)
      if (!signal?.aborted) setCatalogo(nuevo)
    } catch (e) {
      if (!signal?.aborted) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo')
      }
    }
  }, [])

  useEffect(() => {
    const control = new AbortController()
    void recargar(control.signal)
    return () => control.abort()
  }, [recargar])

  return { catalogo, error }
}
