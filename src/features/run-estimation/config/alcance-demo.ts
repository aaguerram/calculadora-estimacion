import type { Alcance } from '@/entities/project-scope'

/**
 * Alcance de ejemplo (el proyecto trabajado en docs/modelo-estimacion.md §7).
 * Sirve de referencia hasta que exista el ABM de alcance sobre Postgres.
 */
export const ALCANCE_DEMO: Alcance = {
  nombre: 'Banca digital — fase 1',
  jornada: { horasDia: 6, diasMes: 20 },
  nivelCompromiso: 80,
  componentes: [
    { id: 'web', nombre: 'Portal web', tipo: 'front-angular', stack: 'angular17', esNuevo: true },
    { id: 'bff', nombre: 'BFF web', tipo: 'bff', stack: 'net8', esNuevo: true },
    { id: 'exp', nombre: 'Micro de experiencia', tipo: 'micro-experiencia', stack: 'net8', esNuevo: true },
    { id: 'neg-a', nombre: 'Micro clientes', tipo: 'micro-negocio', stack: 'net8', esNuevo: true },
    { id: 'neg-b', nombre: 'Micro notificaciones', tipo: 'micro-negocio', stack: 'net8', esNuevo: false },
    { id: 'core', nombre: 'Micro core cuentas', tipo: 'micro-core', stack: 'net8', esNuevo: true },
    { id: 'legacy', nombre: 'Monolito legado', tipo: 'monolito-netfx', stack: 'netfx', esNuevo: false },
  ],
  features: [
    { id: 'f01', categoria: 'pantalla', elementos: [], nombre: 'Alta de cliente', complejidad: 'a', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'exp' }, { componenteId: 'neg-a' }, { componenteId: 'core' }] },
    { id: 'f02', categoria: 'pantalla', elementos: [], nombre: 'Consulta de saldos', complejidad: 'm', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'exp' }, { componenteId: 'core' }] },
    { id: 'f03', categoria: 'pantalla', elementos: [], nombre: 'Transferencia interna', complejidad: 'ma', toca: [{ componenteId: 'web', complejidad: 'a' }, { componenteId: 'bff' }, { componenteId: 'exp' }, { componenteId: 'neg-a' }, { componenteId: 'core' }, { componenteId: 'legacy' }] },
    { id: 'f04', categoria: 'reporte', elementos: [], nombre: 'Historial de movimientos', complejidad: 'm', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'core' }] },
    { id: 'f05', categoria: 'pantalla', elementos: [], nombre: 'Gestión de beneficiarios', complejidad: 'm', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'neg-b' }] },
    { id: 'f06', categoria: 'evento', elementos: [], nombre: 'Notificaciones', complejidad: 'b', toca: [{ componenteId: 'bff' }, { componenteId: 'neg-b' }] },
    { id: 'f07', categoria: 'pantalla', elementos: [], nombre: 'Login y MFA', complejidad: 'a', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'exp' }, { componenteId: 'legacy' }] },
    { id: 'f08', categoria: 'pantalla', elementos: [], nombre: 'Perfil y preferencias', complejidad: 'b', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'neg-b' }] },
    { id: 'f09', categoria: 'reporte', elementos: [], nombre: 'Reportes descargables', complejidad: 'm', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'neg-a' }] },
    { id: 'f10', categoria: 'pantalla', elementos: [], nombre: 'Bloqueo de tarjeta', complejidad: 'a', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'exp' }, { componenteId: 'core' }, { componenteId: 'legacy' }] },
    { id: 'f11', categoria: 'pantalla', elementos: [], nombre: 'Onboarding biométrico', complejidad: 'ma', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'exp' }, { componenteId: 'neg-a' }] },
    { id: 'f12', categoria: 'pantalla', elementos: [], nombre: 'Panel de administración', complejidad: 'm', toca: [{ componenteId: 'web' }, { componenteId: 'bff' }, { componenteId: 'neg-b' }] },
  ],
  integraciones: [
    { id: 'i01', nombre: 'Core bancario (SOAP)', complejidad: 'ma', componenteDuenioId: 'core', esExterna: false, tieneSandbox: false, usos: 5 },
    { id: 'i02', nombre: 'Buró de crédito', complejidad: 'a', componenteDuenioId: 'neg-a', esExterna: true, tieneSandbox: true, usos: 2 },
    { id: 'i03', nombre: 'Proveedor de biometría', complejidad: 'a', componenteDuenioId: 'exp', esExterna: true, tieneSandbox: false, usos: 1 },
    { id: 'i04', nombre: 'Pasarela de notificaciones', complejidad: 'm', componenteDuenioId: 'neg-b', esExterna: true, tieneSandbox: true, usos: 2 },
    { id: 'i05', nombre: 'IAM corporativo (OIDC)', complejidad: 'm', componenteDuenioId: 'bff', esExterna: false, tieneSandbox: true, usos: 12 },
    { id: 'i06', nombre: 'Bus de eventos interno', complejidad: 'b', componenteDuenioId: 'core', esExterna: false, tieneSandbox: true, usos: 4 },
  ],
  drivers: [
    { clave: 'madurez-dominio', etiqueta: 'Madurez del equipo en el dominio', delta: 0 },
    { clave: 'claridad-requisitos', etiqueta: 'Claridad de los requisitos', delta: 0.15 },
    { clave: 'exigencia-nf', etiqueta: 'Exigencia no funcional', delta: 0.1 },
    { clave: 'deuda-tecnica', etiqueta: 'Deuda técnica del entorno', delta: 0.12 },
    { clave: 'terceros', etiqueta: 'Dependencia de terceros', delta: 0.08 },
  ],
}
