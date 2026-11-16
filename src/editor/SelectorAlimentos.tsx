import { useEffect, useState } from 'react'
import type { Alimento } from '../types'

interface Props {
  titulo: string
  alimentos: Alimento[]
  seleccion: string[]
  multiple: boolean
  onCambiar: (ids: string[]) => void
  onCerrar: () => void
}

const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function SelectorAlimentos({ titulo, alimentos, seleccion, multiple, onCambiar, onCerrar }: Props) {
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onCerrar])

  const q = normalizar(busqueda.trim())
  const lista = alimentos
    .filter((a) => !q || normalizar(a.nombre).includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const elegir = (id: string) => {
    if (!multiple) {
      onCambiar([id])
      onCerrar()
      return
    }
    onCambiar(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id])
  }

  return (
    <>
      <div className="panel-fondo panel-fondo--alto" onClick={onCerrar} />
      <aside className="panel panel--alto" role="dialog" aria-label={titulo}>
        <header className="panel__cabecera">
          <div>
            <h2>{titulo}</h2>
            {multiple && <p>Elegí varios</p>}
          </div>
          <button className="panel__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </header>
        <input
          className="panel__buscar"
          type="search"
          placeholder="Buscar por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoFocus={window.matchMedia('(pointer: fine)').matches}
        />
        <div className="panel__lista">
          {lista.length === 0 && <p className="panel__vacio">No hay alimentos con “{busqueda}”.</p>}
          {lista.map((a) => {
            const activo = seleccion.includes(a.id)
            return (
              <button
                key={a.id}
                className={`opcion ${activo ? 'opcion--activa' : ''}`}
                onClick={() => elegir(a.id)}
                aria-pressed={activo}
              >
                <span className="opcion__emoji">{a.emoji ?? '🍽️'}</span>
                <span className="opcion__nombre">
                  {a.nombre}
                  {a.favorito && <span className="opcion__fav"> ★</span>}
                </span>
                {multiple && <span className="opcion__check">{activo ? '✓' : ''}</span>}
              </button>
            )
          })}
        </div>
        {multiple && (
          <button className="panel__listo" onClick={onCerrar}>
            Listo ({seleccion.length})
          </button>
        )}
      </aside>
    </>
  )
}
