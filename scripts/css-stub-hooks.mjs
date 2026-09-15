// Hook de carga para Node: los scripts de linea de comandos importan la public
// API de un slice, y esa public API arrastra componentes que importan CSS
// Modules. Node no sabe cargar .scss, asi que se sustituye por un objeto que
// devuelve el nombre de la clase pedida, igual que hace el bundler.
export async function load(url, context, nextLoad) {
  if (/\.(css|scss|sass)(\?|$)/.test(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default new Proxy({}, { get: (_t, k) => String(k) })',
    }
  }
  return nextLoad(url, context)
}
