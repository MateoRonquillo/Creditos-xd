import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'
type RequestLog = { method: string; path: string; status: number | string; body: string }
type Credit = { id: string }

async function request(path: string, options: RequestInit = {}, token = '') {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('json') ? JSON.stringify(await response.json(), null, 2) : await response.text()
  return { response, body }
}

function App() {
  const [token, setToken] = useState('')
  const [log, setLog] = useState<RequestLog[]>([])
  const [creditId, setCreditId] = useState('')
  const [simulationId, setSimulationId] = useState('')
  const [auth, setAuth] = useState({ name: 'Usuario de prueba', email: `tester-${Date.now()}@demo.local`, password: 'secreto123' })
  const [credit, setCredit] = useState({ name: 'Credito personal', amount: '10000', annualInterestRate: '18', termMonths: '12', amortizationType: 'french' })
  const [simulation, setSimulation] = useState({ amount: '10000', annualInterestRate: '18', termMonths: '12', amortizationType: 'french' })

  const run = async (method: string, path: string, body?: unknown, useToken = false) => {
    try {
      const result = await request(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }, useToken ? token : '')
      setLog((entries) => [{ method, path, status: result.response.status, body: result.body }, ...entries].slice(0, 12))
      return result
    } catch (error) {
      setLog((entries) => [{ method, path, status: 'ERR', body: error instanceof Error ? error.message : 'Error de red' }, ...entries].slice(0, 12))
      return null
    }
  }

  const submitAuth = async (event: FormEvent, action: 'register' | 'login') => {
    event.preventDefault()
    const result = await run('POST', `/auth/${action}`, action === 'register' ? auth : { email: auth.email, password: auth.password })
    if (result?.response.ok) setToken((JSON.parse(result.body) as { token: string }).token)
  }

  const createCredit = async (event: FormEvent) => {
    event.preventDefault()
    const body = { ...credit, amount: Number(credit.amount), annualInterestRate: Number(credit.annualInterestRate), termMonths: Number(credit.termMonths) }
    const result = await run('POST', '/credits', body, true)
    if (result?.response.ok) setCreditId((JSON.parse(result.body) as Credit).id)
  }

  const simulate = async (event: FormEvent) => {
    event.preventDefault()
    const result = await run('POST', '/simulations', { creditId: creditId || null, amount: Number(simulation.amount), annualInterestRate: Number(simulation.annualInterestRate), termMonths: Number(simulation.termMonths), amortizationType: simulation.amortizationType }, true)
    if (result?.response.ok) setSimulationId((JSON.parse(result.body) as { id: string }).id)
  }

  const field = (label: string, value: string, onChange: (value: string) => void, type = 'text') => <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>

  return (
    <main>
      <header className="topbar"><div><p className="eyebrow">CREDITOS / API WORKBENCH</p><h1>Endpoint lab</h1><p className="intro">Prueba el flujo completo del simulador desde una sola pantalla.</p></div><div className={`status ${token ? 'online' : ''}`}><i />{token ? 'Token activo' : 'Sin autenticar'}</div></header>
      <section className="grid">
        <article className="panel wide"><div className="panel-title"><span className="number">01</span><div><h2>Autenticacion</h2><p>POST register / login · GET me</p></div></div><form onSubmit={(event) => submitAuth(event, 'register')} className="form-grid">{field('Nombre', auth.name, (value) => setAuth({ ...auth, name: value }))}{field('Email', auth.email, (value) => setAuth({ ...auth, email: value }), 'email')}{field('Password', auth.password, (value) => setAuth({ ...auth, password: value }), 'password')}<div className="actions"><button type="submit">Registrar</button><button type="button" className="secondary" onClick={(event) => submitAuth(event, 'login')}>Iniciar sesion</button><button type="button" className="ghost" onClick={() => run('GET', '/auth/me', undefined, true)}>GET /me</button></div></form></article>
        <article className="panel"><div className="panel-title"><span className="number">02</span><div><h2>Health checks</h2><p>Disponibilidad de cada servicio</p></div></div><div className="health-list">{['api-gateway', 'auth', 'credits', 'simulations', 'documents'].map((service) => <button key={service} className="health" onClick={() => run('GET', service === 'api-gateway' ? '/../health' : `/${service}/health`)}><span>{service}</span><b>GET</b></button>)}</div></article>
        <article className="panel wide"><div className="panel-title"><span className="number">03</span><div><h2>Creditos</h2><p>CRUD protegido · {creditId ? `id: ${creditId}` : 'sin credito seleccionado'}</p></div></div><form onSubmit={createCredit} className="form-grid">{field('Nombre', credit.name, (value) => setCredit({ ...credit, name: value }))}{field('Monto', credit.amount, (value) => setCredit({ ...credit, amount: value }), 'number')}{field('Tasa anual (%)', credit.annualInterestRate, (value) => setCredit({ ...credit, annualInterestRate: value }), 'number')}{field('Plazo (meses)', credit.termMonths, (value) => setCredit({ ...credit, termMonths: value }), 'number')}<label><span>Amortizacion</span><select value={credit.amortizationType} onChange={(event) => setCredit({ ...credit, amortizationType: event.target.value })}><option value="french">Francesa</option><option value="german">Alemana</option></select></label><div className="actions"><button type="submit">POST /credits</button><button type="button" className="secondary" onClick={() => run('GET', '/credits', undefined, true)}>GET lista</button><button type="button" className="ghost" onClick={() => creditId && run('GET', `/credits/${creditId}`, undefined, true)}>GET detalle</button><button type="button" className="ghost" onClick={() => creditId && run('PUT', `/credits/${creditId}`, { ...credit, amount: Number(credit.amount), annualInterestRate: Number(credit.annualInterestRate), termMonths: Number(credit.termMonths) }, true)}>PUT actualizar</button><button type="button" className="danger" onClick={() => creditId && run('DELETE', `/credits/${creditId}`, undefined, true)}>DELETE</button></div></form></article>
        <article className="panel"><div className="panel-title"><span className="number">04</span><div><h2>Simulaciones</h2><p>POST, historial y detalle</p></div></div><form onSubmit={simulate} className="form-grid">{field('Credit ID (opcional)', creditId, setCreditId)}{field('Monto', simulation.amount, (value) => setSimulation({ ...simulation, amount: value }), 'number')}{field('Tasa anual (%)', simulation.annualInterestRate, (value) => setSimulation({ ...simulation, annualInterestRate: value }), 'number')}{field('Plazo (meses)', simulation.termMonths, (value) => setSimulation({ ...simulation, termMonths: value }), 'number')}<label><span>Amortizacion</span><select value={simulation.amortizationType} onChange={(event) => setSimulation({ ...simulation, amortizationType: event.target.value })}><option value="french">Francesa</option><option value="german">Alemana</option></select></label><div className="actions"><button type="submit">POST /simulations</button><button type="button" className="secondary" onClick={() => run('GET', '/simulations/history', undefined, true)}>GET history</button><button type="button" className="ghost" onClick={() => simulationId && run('GET', `/simulations/${simulationId}`, undefined, true)}>GET detalle</button></div></form></article>
        <article className="panel wide"><div className="panel-title"><span className="number">05</span><div><h2>Documentos</h2><p>Descarga el reporte CSV de una simulacion</p></div></div><div className="inline-form">{field('Simulation ID', simulationId, setSimulationId)}<button onClick={() => simulationId && run('GET', `/documents/simulations/${simulationId}`, undefined, true)}>GET CSV</button></div></article>
      </section>
      <section className="console"><div className="console-head"><div><p className="eyebrow">REQUEST LOG</p><h2>Actividad reciente</h2></div><code>{API_BASE_URL}</code><button className="ghost" onClick={() => setLog([])}>Limpiar</button></div>{log.length === 0 ? <p className="empty">Ejecuta una accion para ver aqui el request y su respuesta.</p> : log.map((entry, index) => <details key={`${entry.path}-${index}`} open={index === 0}><summary><b className="method">{entry.method}</b><span>{entry.path}</span><em className={String(entry.status).startsWith('2') ? 'ok' : 'fail'}>{entry.status}</em></summary><pre>{entry.body || '(sin contenido)'}</pre></details>)}</section>
    </main>
  )
}

export default App
