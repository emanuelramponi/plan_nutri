import { useCallback, useEffect, useMemo, useState } from 'react'
import { PanelAlimentos } from './components/PanelAlimentos'
import { Editor } from './editor/Editor'
import { Plato, nombreCorto } from './components/Plato'
import { cargarPlanRemoto, planEmbebido } from './lib/cargarPlan'
import { armarPlato, calcularPlato } from './lib/plato'
import type { Plan, Seleccion } from './types'

const CLAVE_STORAGE = 'plan-nutri:platos'

function comidaSegunHora(plan: Plan): string {
  const h = new Date().getHours()
  const id = h < 11 ? 'desayuno' : h < 15 ? 'almuerzo' : h < 19 ? 'merienda' : 'cena'
  return plan.comidas.some((c) => c.id === id) ? id : plan.comidas[0].id
}

type Guardado = { fecha: string; platos: Record<string, Seleccion[]> }

const hoy = () => new Date().toISOString().slice(0, 10)

function leerGuardado(): Record<string, Seleccion[]> {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE_STORAGE) ?? 'null') as Guardado | null
    return g && g.fecha === hoy() ? g.platos : {}
  } catch {
    return {}
  }
}

export default function App() {
  const [plan, setPlan] = useState<Plan>(planEmbebido)
  const [comidaId, setComidaId] = useState(() => comidaSegunHora(planEmbebido))
  const [varianteIds, setVarianteIds] = useState<Record<string, string>>({})
  const [platos, setPlatos] = useState<Record<string, Seleccion[]>>(leerGuardado)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    cargarPlanRemoto().then((p) => p && setPlan(p))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ fecha: hoy(), platos }))
    } catch {
      /* sin storage */
    }
  }, [platos])

  const comida = plan.comidas.find((c) => c.id === comidaId) ?? plan.comidas[0]
  const variante = comida.variantes.find((v) => v.id === varianteIds[comida.id]) ?? comida.variantes[0]
  const clave = `${comida.id}:${variante.id}`
  const guardada = platos[clave]
  const valida = !!guardada && guardada.length === variante.items.length
  const nueva = useMemo(
    () => (valida ? null : armarPlato(plan, comida.id, variante)),
    [valida, plan, comida.id, variante],
  )
  const seleccion = valida ? guardada : nueva!

  useEffect(() => {
    if (nueva) setPlatos((p) => ({ ...p, [clave]: nueva }))
  }, [nueva, clave])

  const calculado = useMemo(() => calcularPlato(plan, variante, seleccion), [plan, variante, seleccion])

  const [abierto, setAbierto] = useState<number | null>(null)
  const cerrarPanel = useCallback(() => setAbierto(null), [])

  const cambiar = (i: number, s: Seleccion) =>
    setPlatos((p) => ({ ...p, [clave]: seleccion.map((x, k) => (k === i ? s : x)) }))

  const detalles = calculado
    ? calculado.lineas.flatMap((l) => {
        const nombre = l.alimento ? `${l.alimento.emoji ?? ''} ${nombreCorto(l.alimento)}` : ''
        return [...l.avisos.map((t) => ({ nombre, texto: t, aviso: true })), ...l.notas.map((t) => ({ nombre, texto: t, aviso: false }))]
      })
    : []

  if (editando) {
    return (
      <div className="app">
        <Editor onGuardado={setPlan} onSalir={() => setEditando(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="cabecera">
        <div className="cabecera__fila">
          <h1>Mi plan</h1>
          <button className="boton-editar" onClick={() => { setAbierto(null); setEditando(true) }}>
            ⚙️ Editar plan
          </button>
        </div>
        <nav className="comidas" aria-label="Comidas">
          {plan.comidas.map((c) => (
            <button
              key={c.id}
              className={`comidas__tab ${c.id === comida.id ? 'comidas__tab--activa' : ''}`}
              onClick={() => { setComidaId(c.id); setAbierto(null) }}
            >
              {c.nombre}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {comida.variantes.length > 1 && (
          <div className="variantes" role="radiogroup">
            {comida.variantes.map((v) => (
              <button
                key={v.id}
                role="radio"
                aria-checked={v.id === variante.id}
                className={`variantes__op ${v.id === variante.id ? 'variantes__op--activa' : ''}`}
                onClick={() => setVarianteIds((s) => ({ ...s, [comida.id]: v.id }))}
              >
                {v.nombre}
              </button>
            ))}
          </div>
        )}

        <button
          className="boton-armar"
          onClick={() => setPlatos((p) => ({ ...p, [clave]: armarPlato(plan, comida.id, variante) }))}
        >
          🎲 Armame un plato
        </button>

        {calculado && (
          <>
            <Plato plan={plan} variante={variante} calculado={calculado} activo={abierto} onAbrir={setAbierto} />
            <p className="ayuda">Tocá una parte del plato para cambiarla</p>

            {(calculado.avisosGenerales.length > 0 || detalles.length > 0) && (
              <section className="detalles">
                {calculado.avisosGenerales.map((a) => (
                  <p key={a} className="aviso aviso--general">⚠ {a}</p>
                ))}
                {detalles.map((d, k) => (
                  <p key={k} className={d.aviso ? 'detalle detalle--aviso' : 'detalle'}>
                    <strong>{d.nombre}</strong> {d.aviso ? '⚠ ' : ''}
                    {d.texto}
                  </p>
                ))}
              </section>
            )}

            {abierto !== null && calculado.lineas[abierto] && (
              <PanelAlimentos
                key={`${clave}-${abierto}`}
                plan={plan}
                linea={calculado.lineas[abierto]}
                comidaId={comida.id}
                seleccion={seleccion[abierto]}
                onCambiar={(s) => cambiar(abierto, s)}
                onCerrar={cerrarPanel}
              />
            )}
          </>
        )}

        <p className="pie">💧 2 vasos de agua con cada comida</p>
      </main>
    </div>
  )
}
