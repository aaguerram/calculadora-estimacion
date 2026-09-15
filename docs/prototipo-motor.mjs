// Motor de estimacion v2 — paralelizacion limitada por componente (critical path)
const H = 120 // 6h x 20d

const TIPO = {
  'front-angular':     { base: 40, boot: 60, cap: 5 },
  'bff':               { base: 20, boot: 24, cap: 3 },
  'micro-experiencia': { base: 28, boot: 32, cap: 3 },
  'micro-negocio':     { base: 44, boot: 40, cap: 3 },
  'micro-core':        { base: 60, boot: 56, cap: 3 },
  'monolito-netcore':  { base: 52, boot: 0,  cap: 3 },
  'monolito-netfx':    { base: 68, boot: 0,  cap: 2 },
}
const CPLX  = { mb:0.4, b:0.7, m:1.0, a:1.6, ma:2.2 }
const PERT  = { mb:[.85,1.25], b:[.85,1.30], m:[.80,1.50], a:[.70,1.90], ma:[.65,2.30] }
const STACK = { net8:1.0, netcore:1.0, netfx:1.30, angular17:1.0, angular12:1.20 }
const INTEG = { b:8, m:24, a:56, ma:96 }

const componentes = [
  { id:'web',    tipo:'front-angular',     stack:'angular17', nuevo:true  },
  { id:'bff',    tipo:'bff',               stack:'net8',      nuevo:true  },
  { id:'exp',    tipo:'micro-experiencia', stack:'net8',      nuevo:true  },
  { id:'neg-a',  tipo:'micro-negocio',     stack:'net8',      nuevo:true  },
  { id:'neg-b',  tipo:'micro-negocio',     stack:'net8',      nuevo:false },
  { id:'core',   tipo:'micro-core',        stack:'net8',      nuevo:true  },
  { id:'legacy', tipo:'monolito-netfx',    stack:'netfx',     nuevo:false },
]
const features = [
  { n:'Alta de cliente',         c:'a',  toca:['web','bff','exp','neg-a','core'] },
  { n:'Consulta de saldos',      c:'m',  toca:['web','bff','exp','core'] },
  { n:'Transferencia interna',   c:'ma', toca:['web','bff','exp','neg-a','core','legacy'] },
  { n:'Historial movimientos',   c:'m',  toca:['web','bff','core'] },
  { n:'Gestion de beneficiarios',c:'m',  toca:['web','bff','neg-b'] },
  { n:'Notificaciones',          c:'b',  toca:['bff','neg-b'] },
  { n:'Login / MFA',             c:'a',  toca:['web','bff','exp','legacy'] },
  { n:'Perfil y preferencias',   c:'b',  toca:['web','bff','neg-b'] },
  { n:'Reportes descargables',   c:'m',  toca:['web','bff','neg-a'] },
  { n:'Bloqueo de tarjeta',      c:'a',  toca:['web','bff','exp','core','legacy'] },
  { n:'Onboarding biometrico',   c:'ma', toca:['web','bff','exp','neg-a'] },
  { n:'Panel de administracion', c:'m',  toca:['web','bff','neg-b'] },
]
const integraciones = [
  { n:'Core bancario (SOAP)',       c:'ma', duenio:'core',  externa:false, sandbox:false, usos:5 },
  { n:'Buro de credito',            c:'a',  duenio:'neg-a', externa:true,  sandbox:true,  usos:2 },
  { n:'Proveedor biometria',        c:'a',  duenio:'exp',   externa:true,  sandbox:false, usos:1 },
  { n:'Pasarela notificaciones',    c:'m',  duenio:'neg-b', externa:true,  sandbox:true,  usos:2 },
  { n:'IAM corporativo (OIDC)',     c:'m',  duenio:'bff',   externa:false, sandbox:true,  usos:12 },
  { n:'Bus de eventos interno',     c:'b',  duenio:'core',  externa:false, sandbox:true,  usos:4 },
]
// Drivers ADITIVOS: factor = 1 + suma(deltas)
const drivers = { madurezDominio:0.00, claridadRequisitos:0.15, exigenciaNF:0.10, deudaTecnica:0.12, terceros:0.08 }
const FD = 1 + Object.values(drivers).reduce((a,b)=>a+b,0)

const OV = { analisis:0.15, qa:0.25, devops:0.08, gestion:0.12, doc:0.05 }
const GAMMA = 0.02        // sobrecarga intra-stream por canal
const RHO_SIGMA = 0.18    // riesgo comun (lognormal) para Monte Carlo

// ---------- 1. Esfuerzo de desarrollo por componente ----------
const dev = new Map(componentes.map(c => [c.id, 0]))
const items = []
const add = (id,h,o,p) => { dev.set(id, dev.get(id)+h); items.push({h,o,p,id}) }

for (const f of features) for (const id of f.toca) {
  const c = componentes.find(x=>x.id===id), t = TIPO[c.tipo]
  const h = t.base * CPLX[f.c] * STACK[c.stack]
  add(id, h, h*PERT[f.c][0], h*PERT[f.c][1])
}
for (const c of componentes) if (c.nuevo && TIPO[c.tipo].boot) {
  const h = TIPO[c.tipo].boot; add(c.id, h, h*0.85, h*1.40)
}
let bootTotal = componentes.filter(c=>c.nuevo).reduce((a,c)=>a+TIPO[c.tipo].boot,0)
for (const i of integraciones) {
  let h = INTEG[i.c] * (i.externa?1.4:1) * (i.sandbox?1:1.3) * (1 + 0.25*Math.max(0,i.usos-1))
  add(i.duenio, h, h*0.70, h*2.20)
}

const devBruto = [...dev.values()].reduce((a,b)=>a+b,0)

// ---------- 2. Monte Carlo con riesgo comun ----------
const tri=(o,m,p)=>{const u=Math.random(),c=(m-o)/(p-o);return u<c?o+Math.sqrt(u*(p-o)*(m-o)):p-Math.sqrt((1-u)*(p-o)*(p-m))}
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
const N=20000, sims=new Array(N)
for(let k=0;k<N;k++){
  let s=0; for(const it of items) s+=tri(it.o,it.h,it.p)
  sims[k]= s * FD * Math.exp(RHO_SIGMA*gauss() - RHO_SIGMA*RHO_SIGMA/2)
}
sims.sort((a,b)=>a-b)
const P=q=>sims[Math.floor(q*N)]
const devP50=P(.50), devP80=P(.80), devP90=P(.90)
const escala = devP80 / (devBruto*FD)   // cuanto sube el dev al exigir P80

// ---------- 3. Streams por componente ----------
const Tc=(pm,m)=> pm*(1+GAMMA*m*(m-1)/2)/m
const streams = componentes.map(c=>{
  const pm = dev.get(c.id)*FD*escala/H
  const cap = TIPO[c.tipo].cap
  let best={m:1,t:Tc(pm,1)}
  for(let m=1;m<=cap;m++){const t=Tc(pm,m); if(t<best.t) best={m,t}}
  return { id:c.id, tipo:c.tipo, pm, cap, mRapido:best.m, tMin:best.t }
})
const tCritico = Math.max(...streams.map(s=>s.tMin))

const tSerial = Math.min(3, Math.max(0.5, (bootTotal*FD/H)/2))
const DELTA = 0.0015   // coordinacion global entre todas las personas del proyecto
const RAMP  = 0.4      // PM de onboarding por persona adicional (mas alla de la 1a)

const staffing = (tTarget)=>{
  // Punto fijo: mas gente -> mas coordinacion -> mas esfuerzo -> mas gente.
  let nTot = 1, plan = [], tDev = 0, nDev = 0, pmDev = 0, coord = 1
  for (let iter = 0; iter < 25; iter++) {
    coord = 1 + DELTA * nTot * (nTot - 1) / 2
    plan = streams.map(s=>{
      const pm = s.pm * coord
      let m=1; while(m<s.cap && Tc(pm,m)>tTarget) m++
      return { ...s, pm, m, t:Tc(pm,m) }
    })
    tDev = Math.max(...plan.map(p=>p.t))
    nDev = plan.reduce((a,p)=>a+p.m,0)
    pmDev = plan.reduce((a,p)=>a+p.pm,0)
    const nQA0=Math.max(1,Math.round(pmDev*OV.qa/tDev*2)/2)
    const nOps0=Math.max(.5,Math.round(pmDev*OV.devops/tDev*2)/2)
    const nG0=Math.max(1,Math.round(pmDev*(OV.gestion+OV.analisis)/tDev*2)/2)
    const next = nDev+nQA0+nOps0+nG0
    if (Math.abs(next-nTot) < 0.01) { nTot = next; break }
    nTot = next
  }
  const tEstab = Math.max(0.5, 0.10*tDev)
  const tTotal = tSerial + tDev + tEstab
  const nQA   = Math.max(1, Math.round(pmDev*OV.qa/tDev*2)/2)
  const nOps  = Math.max(0.5, Math.round(pmDev*OV.devops/tDev*2)/2)
  const nGest = Math.max(1, Math.round(pmDev*(OV.gestion+OV.analisis)/tDev*2)/2)
  const nT    = nDev+nQA+nOps+nGest
  const onboarding = RAMP * Math.max(0, nT - 1)
  return { plan, tDev, tTotal, nDev, nQA, nOps, nGest, nTot:nT, coord,
           pmFact: nT*tTotal + onboarding, onboarding }
}

const f1=x=>x.toFixed(1)
console.log('=== ESFUERZO DE DESARROLLO ===')
console.log('Dev bruto:', f1(devBruto),'h   Factor drivers:', FD.toFixed(2))
console.log('Dev nominal:', f1(devBruto*FD),'h =', f1(devBruto*FD/H),'PM')
console.log('Monte Carlo 20k (con riesgo comun sigma='+RHO_SIGMA+'):')
console.log('  P50', f1(devP50/H),'PM |  P80', f1(devP80/H),'PM |  P90', f1(devP90/H),'PM')
console.log('  -> se compromete P80; colchon sobre P50 =', ((devP80/devP50-1)*100).toFixed(0)+'%')
const totP80 = devP80*(1+OV.analisis+OV.qa+OV.devops+OV.gestion+OV.doc)
console.log('TOTAL proyecto (dev P80 x 1.65):', f1(totP80),'h =', f1(totP80/H),'PM\n')

console.log('=== STREAMS (esfuerzo dev @P80) ===')
console.log(' comp        PM     cap  m*  t_min(m)')
for(const s of streams.sort((a,b)=>b.pm-a.pm))
  console.log(` ${s.id.padEnd(10)} ${f1(s.pm).padStart(5)}   ${s.cap}   ${s.mRapido}   ${f1(s.tMin)}`)
console.log('\nRuta critica (stream mas largo a maxima dotacion):', f1(tCritico),'meses')
console.log('Arranque serial (arquitectura+bootstrap, 2 pers.):', f1(tSerial),'meses\n')

console.log('=== FRONTERA TIEMPO / EQUIPO ===')
console.log(' t_objetivo   personas(dev+qa+ops+gest)   duracion total   PM facturables')
const opciones=[]
for(let t=tCritico; t<=tCritico*3.6; t*=1.08){
  const r=staffing(t); opciones.push({t, ...r})
}
const seen=new Set(); const filtradas=opciones.filter(o=>{const k=o.nTot; if(seen.has(k))return false; seen.add(k); return true})
for(const o of filtradas.sort((a,b)=>b.nTot-a.nTot))
  console.log(` ${f1(o.tDev).padStart(6)}      ${String(o.nDev)}+${o.nQA}+${o.nOps}+${o.nGest} = ${f1(o.nTot).padStart(5)}        ${f1(o.tTotal).padStart(6)}          ${f1(o.pmFact).padStart(6)}   coord x${o.coord.toFixed(2)}`)

const rapido = filtradas.reduce((a,b)=> b.tTotal<a.tTotal?b:a)
const mejorCoste = filtradas.reduce((a,b)=> b.pmFact<a.pmFact?b:a)
const rodilla = mejorCoste
console.log('\n--- RESPUESTAS ---')
console.log('Mas rapido posible :', f1(rapido.nTot),'personas ·', f1(rapido.tTotal),'meses ·', f1(rapido.pmFact),'PM facturables')
console.log('OPTIMO (minimo coste total):', f1(rodilla.nTot),'personas ·', f1(rodilla.tTotal),'meses ·', f1(rodilla.pmFact),'PM')
const barato = filtradas.reduce((a,b)=> b.nTot<a.nTot?b:a)
console.log('Equipo minimo viable  :', f1(barato.nTot),'personas ·', f1(barato.tTotal),'meses ·', f1(barato.pmFact),'PM')
console.log('Sobrecoste del equipo mas rapido vs optimo:', ((rapido.pmFact/rodilla.pmFact-1)*100).toFixed(0)+'% de esfuerzo para ganar', f1(rodilla.tTotal-rapido.tTotal),'meses')
console.log('\nForma del equipo optimo:')
for(const p of rodilla.plan.filter(p=>p.m>0).sort((a,b)=>b.pm-a.pm))
  console.log(`  ${p.id.padEnd(10)} ${p.m} dev  (${f1(p.t)} meses)`)
console.log(`  QA ${rodilla.nQA} · DevOps ${rodilla.nOps} · Lead/BA ${rodilla.nGest}`)
