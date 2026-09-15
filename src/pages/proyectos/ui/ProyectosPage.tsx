import { useNavigate } from 'react-router'

import { EstimationProjectBoard } from '@/widgets/estimation-project-board'

/** Página: elegir o crear el proyecto a estimar. */
export function ProyectosPage() {
  const navegar = useNavigate()

  return (
    <EstimationProjectBoard
      proyectoSeleccionadoId={null}
      onSeleccionar={(id) => {
        if (id) navegar(`/proyecto/${id}`)
      }}
    />
  )
}
