import { useParams } from 'react-router'

import { ScopeWorkbench } from '@/widgets/scope-workbench'

/** Página: el alcance y la estimación del proyecto de la URL. */
export function AlcancePage() {
  const { proyectoId } = useParams<{ proyectoId: string }>()
  return <ScopeWorkbench proyectoId={proyectoId ?? null} />
}
