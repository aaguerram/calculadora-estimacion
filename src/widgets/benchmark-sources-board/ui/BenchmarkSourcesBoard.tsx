import {
  BenchmarkSourceList,
  useBenchmarkSources,
} from '@/features/browse-benchmark-sources'
import { PageSection } from '@/shared/ui'

/**
 * Widget: las fuentes de referencia cargadas en el esquema `benchmark`.
 * Son datasets públicos de investigación, no proyectos de la organización.
 */
export function BenchmarkSourcesBoard() {
  const { state } = useBenchmarkSources()

  return (
    <PageSection
      title="Fuentes de datos de referencia"
      description="Datasets públicos de estimación cargados en Postgres. Acotan rangos y validan el método; no fijan los coeficientes, porque la productividad varía hasta 3.7× entre organizaciones."
    >
      <BenchmarkSourceList state={state} />
    </PageSection>
  )
}
