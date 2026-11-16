import { useEffect, useState } from 'react'
import { candidatos, esOtroNivel, nombreGrupo, vaEnComida, type LineaPlato } from '../lib/plato'
import { formatearNumero } from '../lib/formato'
import { esFijo, esGrupo, esLibre, type Alimento, type Plan, type Seleccion } from '../types'

interface Props {
  plan: Plan
  linea: LineaPlato
  comidaId: string
  seleccion: Seleccion
  onCambiar: (s: Seleccion) => void
  onCerrar: () => void
}

const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function PanelAlimentos({ plan, linea, comidaId, seleccion, onCambiar, onCerrar }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const item = linea.item

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onCerrar])

  if (esFijo(item)) return null

  const q = normalizar(busqueda.trim())
  const lista = candidatos(plan, item).filter((a) => !q || normalizar(a.nombre).includes(q))

  const titulo =
    item.tipo === 'fruta' ? 'Fruta' : item.tipo === 'verdura' ? 'Verduras' : nombreGrupo(plan, item.grupo)
  const subtitulo = esGrupo(item)
    ? `${formatearNumero(item.porciones)} ${item.porciones === 1 ? 'porción' : 'porciones'}`
    : esLibre(item)
      ? `${item.libre} · elegí varias`
      : ''

  const elegidos = Array.isArray(seleccion) ? seleccion : []
  const elegir = (a: Alimento) => {
    if (esLibre(item)) {
      onCambiar(elegidos.includes(a.id) ? elegidos.filter((e) => e !== a.id) : [...elegidos, a.id])
    } else {
      onCambiar(a.id)
      onCerrar()
    }
  }
  const activo = (a: Alimento) => (esLibre(item) ? elegidos.includes(a.id) : seleccion === a.id)

  const sugeridos = esGrupo(item) ? item.sugeridos ?? [] : []
  const destacados = lista.filter(
    (a) => !esOtroNivel(item, a) && vaEnComida(a, comidaId) && (a.favorito || sugeridos.includes(a.id)),
  )
  const otroNivel = lista.filter((a) => esOtroNivel(item, a))
  const otros = lista.filter((a) => !destacados.includes(a) && !otroNivel.includes(a))

  const seccion = (nombre: string, alimentos: Alimento[]) =>
    alimentos.length > 0 && (
      <section className="panel__seccion">
        <h3>{nombre}</h3>
        {alimentos.map((a) => (
          <button
            key={a.id}
            className={`opcion ${activo(a) ? 'opcion--activa' : ''}`}
            onClick={() => elegir(a)}
            aria-pressed={activo(a)}
          >
            <span className="opcion__emoji">{a.emoji ?? '🍽️'}</span>
            <span className="opcion__nombre">
              {a.nombre}
              {a.favorito && <span className="opcion__fav"> ★</span>}
            </span>
            {a.aviso && <span className="opcion__aviso">{plan.avisos[a.aviso] ?? a.aviso}</span>}
            {esLibre(item) && <span className="opcion__check">{activo(a) ? '✓' : ''}</span>}
          </button>
        ))}
      </section>
    )

  return (
    <>
      <div className="panel-fondo" onClick={onCerrar} />
      <aside className="panel" role="dialog" aria-label={`Elegir ${titulo}`}>
        <header className="panel__cabecera">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
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
          {seccion('Favoritos y sugeridos', destacados)}
          {seccion('Otras opciones', otros)}
          {seccion('Otro nivel de proteína (se convierte la cantidad)', otroNivel)}
        </div>
        {esLibre(item) && (
          <button className="panel__listo" onClick={onCerrar}>
            Listo ({elegidos.length})
          </button>
        )}
      </aside>
    </>
  )
}
