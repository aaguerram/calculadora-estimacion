import { useCallback, useSyncExternalStore } from 'react'

import { fijarToken, obtenerToken, suscribirToken, tokenVieneDelEntorno } from '@/shared/api'

/**
 * En produccion este token lo deja el flujo OIDC corporativo.
 * En local lo precarga `VITE_POSTGREST_TOKEN` (`npm run token:env`).
 */
export function useApiToken() {
  const token = useSyncExternalStore(suscribirToken, obtenerToken, () => '')
  const guardar = useCallback((valor: string) => fijarToken(valor), [])
  return {
    token,
    guardar,
    hayToken: token.length > 0,
    esDelEntorno: token.length > 0 && tokenVieneDelEntorno(),
  }
}
