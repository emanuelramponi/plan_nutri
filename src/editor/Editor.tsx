import { useEffect, useState } from 'react'
import { ErrorGithub, guardarPlan, guardarToken, leerPlanConSha, leerToken, URL_CREAR_TOKEN } from '../lib/github'
import { validarPlan } from '../lib/validar'
import type { Plan } from '../types'
import { TabAlimentos } from './TabAlimentos'
import { TabComidas } from './TabComidas'
import './editor.css'

interface Props {
  onGuardado: (p: Plan) => void
  onSalir: () => void
}

type Estado =
  | { tipo: 'sin-token' }
  | { tipo: 'cargando' }
  | { tipo: 'listo' }
  | { tipo: 'error'; mensaje: string }

export function Editor({ onGuardado, onSalir }: Props) {
  const [token, setToken] = useState<string | null>(leerToken)
  const [estado, setEstado] = useState<Estado>(token ? { tipo: 'cargando' } : { tipo: 'sin-token' })
  const [original, setOriginal] = useState<Plan | null>(null)
  const [borrador, setBorrador] = useState<Plan | null>(null)
  const [sha, setSha] = useState('')
  const [tab, setTab] = useState<'alimentos' | 'comidas'>('alimentos')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string[] } | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!token) return
    setEstado({ tipo: 'cargando' })
    leerPlanConSha(token)
      .then(({ plan, sha }) => {
        setOriginal(plan)
        setBorrador(plan)
        setSha(sha)
        setEstado({ tipo: 'listo' })
      })
      .catch((e: unknown) => {
        if (e instanceof ErrorGithub && e.tipo === 'token') {
          guardarToken(null)
          setToken(null)
          setEstado({ tipo: 'sin-token' })
          setMensaje({ ok: false, texto: [e.message] })
        } else {
          setEstado({ tipo: 'error', mensaje: e instanceof Error ? e.message : 'Error desconocido' })
        }
      })
  }, [token, intento])

  const hayCambios = !!borrador && !!original && JSON.stringify(borrador) !== JSON.stringify(original)

  const salir = () => {
    if (hayCambios && !window.confirm('Tenés cambios sin guardar. ¿Salir igual?')) return
    onSalir()
  }

  const guardar = async () => {
    if (!borrador || !token) return
    const errores = validarPlan(borrador)
    if (errores.length) {
      setMensaje({ ok: false, texto: errores })
      return
    }
    setGuardando(true)
    setMensaje(null)
    try {
      const nuevoSha = await guardarPlan(token, borrador, sha, 'Editado desde la app')
      setSha(nuevoSha)
      setOriginal(borrador)
      onGuardado(borrador)
      setMensaje({ ok: true, texto: ['Guardado ✓'] })
    } catch (e) {
      setMensaje({ ok: false, texto: [e instanceof Error ? e.message : 'No se pudo guardar.'] })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="editor">
      <header className="editor__cabecera">
        <button className="boton-volver" onClick={salir}>← Volver</button>
        <h1>Editar plan</h1>
      </header>

      {estado.tipo === 'sin-token' && (
        <FormToken
          error={mensaje && !mensaje.ok ? mensaje.texto[0] : undefined}
          onListo={(t) => {
            guardarToken(t)
            setMensaje(null)
            setToken(t)
          }}
        />
      )}

      {estado.tipo === 'cargando' && <p className="editor__estado">Cargando el plan desde GitHub…</p>}

      {estado.tipo === 'error' && (
        <div className="editor__estado">
          <p>{estado.mensaje}</p>
          <button className="boton-secundario" onClick={() => setIntento((n) => n + 1)}>Reintentar</button>
        </div>
      )}

      {estado.tipo === 'listo' && borrador && (
        <>
          <nav className="variantes" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'alimentos'}
              className={`variantes__op ${tab === 'alimentos' ? 'variantes__op--activa' : ''}`}
              onClick={() => setTab('alimentos')}
            >
              Alimentos
            </button>
            <button
              role="tab"
              aria-selected={tab === 'comidas'}
              className={`variantes__op ${tab === 'comidas' ? 'variantes__op--activa' : ''}`}
              onClick={() => setTab('comidas')}
            >
              Comidas
            </button>
          </nav>

          {tab === 'alimentos' ? (
            <TabAlimentos plan={borrador} onCambiar={setBorrador} />
          ) : (
            <TabComidas plan={borrador} onCambiar={setBorrador} />
          )}

          <footer className="editor__pie">
            {mensaje && (
              <div className={mensaje.ok ? 'mensaje mensaje--ok' : 'mensaje mensaje--error'}>
                {mensaje.texto.slice(0, 5).map((t) => (
                  <p key={t}>{t}</p>
                ))}
                {mensaje.texto.length > 5 && <p>…y {mensaje.texto.length - 5} más.</p>}
              </div>
            )}
            <div className="editor__botones">
              <span className="editor__cambios">{hayCambios ? '● Cambios sin guardar' : 'Sin cambios'}</span>
              <button
                className="boton-secundario"
                disabled={!hayCambios || guardando}
                onClick={() => {
                  setBorrador(original)
                  setMensaje(null)
                }}
              >
                Descartar
              </button>
              <button className="boton-principal" disabled={!hayCambios || guardando} onClick={guardar}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

function FormToken({ error, onListo }: { error?: string; onListo: (t: string) => void }) {
  const [valor, setValor] = useState('')
  return (
    <div className="token">
      <p>Para guardar cambios necesitás un token de GitHub con permiso solo sobre este repo. Se crea una vez por dispositivo.</p>
      <ol>
        <li>
          Abrí <a href={URL_CREAR_TOKEN} target="_blank" rel="noreferrer">crear token en GitHub</a>.
        </li>
        <li>Poné un nombre (ej. "plan nutri") y una expiración (ej. 1 año).</li>
        <li>En <strong>Repository access</strong> elegí <strong>Only select repositories</strong> → <code>plan_nutri</code>.</li>
        <li>En <strong>Permissions → Repository permissions</strong>, poné <strong>Contents</strong> en <strong>Read and write</strong>.</li>
        <li>Tocá <strong>Generate token</strong>, copialo y pegalo acá.</li>
      </ol>
      {error && <p className="mensaje mensaje--error">{error}</p>}
      <input
        className="campo-buscar"
        type="password"
        placeholder="github_pat_…"
        value={valor}
        onChange={(e) => setValor(e.target.value.trim())}
        autoComplete="off"
      />
      <button className="boton-principal" disabled={!valor} onClick={() => onListo(valor)}>
        Conectar
      </button>
      <p className="token__nota">El token queda guardado solo en este navegador. Para ver el plan no hace falta.</p>
    </div>
  )
}
