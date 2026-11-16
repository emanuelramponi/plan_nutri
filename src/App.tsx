import { useEffect, useMemo, useState } from 'react'
import { ItemPlato } from './components/ItemPlato'
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
  const seleccion = platos[clave]

  useEffect(() => {
    if (!seleccion || seleccion.length !== variante.items.length) {
      setPlatos((p) => ({ ...p, [clave]: armarPlato(plan, comida.id, variante) }))
    }
  }, [clave, seleccion, plan, variante])

  const calculado = useMemo(
    () => (seleccion ? calcularPlato(plan, variante, seleccion) : null),
    [plan, variante, seleccion],
  )

  const cambiar = (i: number, s: Seleccion) =>
    setPlatos((p) => ({ ...p, [clave]: p[clave].map((x, k) => (k === i ? s : x)) }))

  return (
    <div className="app">
      <header className="cabecera">
        <h1>Mi plan</h1>
        <nav className="comidas" aria-label="Comidas">
          {plan.comidas.map((c) => (
            <button
              key={c.id}
              className={`comidas__tab ${c.id === comida.id ? 'comidas__tab--activa' : ''}`}
              onClick={() => setComidaId(c.id)}
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
          <section className="plato">
            {calculado.avisosGenerales.map((a) => (
              <p key={a} className="aviso aviso--general">⚠ {a}</p>
            ))}
            {calculado.lineas.map((linea, i) => (
              <ItemPlato
                key={`${clave}-${i}`}
                plan={plan}
                linea={linea}
                comidaId={comida.id}
                seleccion={seleccion[i]}
                onCambiar={(s) => cambiar(i, s)}
              />
            ))}
          </section>
        )}

        <p className="pie">💧 2 vasos de agua con cada comida</p>
      </main>
    </div>
  )
}
