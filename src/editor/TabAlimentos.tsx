import { useState } from 'react'
import { crearId, quitarReferencias } from '../lib/validar'
import type { Alimento, GrupoId, Plan } from '../types'
import { FormAlimento } from './FormAlimento'

interface Props {
  plan: Plan
  onCambiar: (p: Plan) => void
}

const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function TabAlimentos({ plan, onCambiar }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState<GrupoId | 'todos'>('todos')
  const [editando, setEditando] = useState<{ alimento: Alimento; nuevo: boolean } | null>(null)

  const q = normalizar(busqueda.trim())
  const lista = plan.alimentos
    .filter((a) => (grupo === 'todos' || a.grupo === grupo) && (!q || normalizar(a.nombre).includes(q)))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const nuevo = () =>
    setEditando({
      nuevo: true,
      alimento: {
        id: '',
        nombre: '',
        grupo: grupo === 'todos' ? 'hc' : grupo,
        ...(grupo === 'proteina' ? { nivel: 'alta' as const } : {}),
        ...(grupo === 'fibra' ? { tipo: 'verdura' as const } : {}),
        porcion: { cantidad: 1, unidad: 'unidad' },
      },
    })

  const guardar = (a: Alimento) => {
    if (editando?.nuevo) {
      const id = crearId(a.nombre, new Set(plan.alimentos.map((x) => x.id)))
      onCambiar({ ...plan, alimentos: [...plan.alimentos, { ...a, id }] })
    } else {
      onCambiar({ ...plan, alimentos: plan.alimentos.map((x) => (x.id === a.id ? a : x)) })
    }
    setEditando(null)
  }

  const borrar = (id: string) => {
    const sinRefs = quitarReferencias(plan, id)
    onCambiar({ ...sinRefs, alimentos: sinRefs.alimentos.filter((x) => x.id !== id) })
    setEditando(null)
  }

  const nombreGrupo = (id: string) => plan.grupos.find((g) => g.id === id)?.nombre ?? id
  const colorGrupo = (id: string) => plan.grupos.find((g) => g.id === id)?.color

  return (
    <div className="tab">
      <input
        className="campo-buscar"
        type="search"
        placeholder="Buscar alimento…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
      <div className="chips chips--scroll">
        <button className={`chip ${grupo === 'todos' ? 'chip--activo' : ''}`} onClick={() => setGrupo('todos')}>
          Todos
        </button>
        {plan.grupos.map((g) => (
          <button key={g.id} className={`chip ${grupo === g.id ? 'chip--activo' : ''}`} onClick={() => setGrupo(g.id)}>
            {g.nombre}
          </button>
        ))}
      </div>

      <button className="boton-agregar" onClick={nuevo}>
        + Nuevo alimento
      </button>

      <ul className="lista-editor">
        {lista.map((a) => (
          <li key={a.id}>
            <button className="fila-editor" onClick={() => setEditando({ alimento: a, nuevo: false })}>
              <span className="fila-editor__emoji">{a.emoji ?? '🍽️'}</span>
              <span className="fila-editor__texto">
                <strong>
                  {a.nombre}
                  {a.favorito && <span className="opcion__fav"> ★</span>}
                </strong>
                <span>
                  <span className="punto" style={{ background: colorGrupo(a.grupo) }} />
                  {nombreGrupo(a.grupo)}
                  {a.nivel && ` · ${a.nivel === 'alta' ? '20-25g' : '8-10g'}`}
                  {a.tipo && ` · ${a.tipo}`}
                  {a.porcion && ` · ${a.porcion.cantidad} ${a.porcion.unidad}`}
                </span>
              </span>
              <span className="fila-editor__flecha">›</span>
            </button>
          </li>
        ))}
        {lista.length === 0 && <li className="panel__vacio">No hay alimentos con ese filtro.</li>}
      </ul>

      {editando && (
        <FormAlimento
          key={editando.alimento.id || 'nuevo'}
          plan={plan}
          alimento={editando.alimento}
          nuevo={editando.nuevo}
          onGuardar={guardar}
          onBorrar={() => borrar(editando.alimento.id)}
          onCerrar={() => setEditando(null)}
        />
      )}
    </div>
  )
}
