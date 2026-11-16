import { useState } from 'react'
import { candidatos, esOtroNivel, nombreGrupo, vaEnComida, type LineaPlato } from '../lib/plato'
import { formatearNumero } from '../lib/formato'
import { esFijo, esGrupo, esLibre, type Alimento, type Plan, type Seleccion } from '../types'

interface Props {
  plan: Plan
  linea: LineaPlato
  comidaId: string
  seleccion: Seleccion
  onCambiar: (s: Seleccion) => void
}

export function ItemPlato({ plan, linea, comidaId, seleccion, onCambiar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const { item } = linea

  if (esFijo(item)) {
    return (
      <div className="item item--fijo">
        <div className="item__cuerpo">
          <span className="item__nombre">{linea.alimento?.nombre ?? item.fijo}</span>
          {linea.cantidad && <span className="item__cantidad">{linea.cantidad}</span>}
        </div>
      </div>
    )
  }

  const grupo = plan.grupos.find((g) => g.id === item.grupo)
  const etiqueta = esGrupo(item)
    ? `${tipoONombre(plan, item.grupo, item.tipo)} · ${formatearNumero(item.porciones)} ${item.porciones === 1 ? 'porción' : 'porciones'}`
    : `${tipoONombre(plan, item.grupo, item.tipo)} · libre`

  return (
    <div className={`item ${linea.cubierto ? 'item--cubierto' : ''}`} style={{ ['--color-grupo' as string]: grupo?.color }}>
      <button className="item__cuerpo" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        <span className="item__etiqueta">{etiqueta}</span>
        {esLibre(item) ? (
          <>
            <span className="item__nombre">{linea.alimentos?.map((a) => a.nombre).join(', ') || 'Elegí verduras'}</span>
            <span className="item__cantidad">{item.libre}</span>
          </>
        ) : (
          <>
            <span className="item__nombre">{linea.alimento?.nombre ?? 'Elegí una opción'}</span>
            {linea.cantidad && (
              <span className="item__cantidad">
                {linea.cantidad}
                {linea.gramos && <span className="item__gramos"> ({linea.gramos})</span>}
              </span>
            )}
          </>
        )}
        {linea.notas.map((n) => (
          <span key={n} className="item__nota">{n}</span>
        ))}
        {linea.avisos.length > 0 && (
          <span className="item__avisos">
            {linea.avisos.map((a) => (
              <span key={a} className="aviso">⚠ {a}</span>
            ))}
          </span>
        )}
        <span className="item__cambiar">{abierto ? 'Cerrar' : 'Cambiar'}</span>
      </button>

      {abierto && (
        <Selector
          plan={plan}
          linea={linea}
          comidaId={comidaId}
          seleccion={seleccion}
          onCambiar={(s) => {
            onCambiar(s)
            if (!esLibre(item)) setAbierto(false)
          }}
        />
      )}
    </div>
  )
}

function tipoONombre(plan: Plan, grupo: string, tipo?: string) {
  if (tipo === 'fruta') return 'Fruta'
  if (tipo === 'verdura') return 'Verduras'
  return nombreGrupo(plan, grupo)
}

function Selector({ plan, linea, comidaId, seleccion, onCambiar }: Props) {
  const item = linea.item
  if (esFijo(item)) return null
  const lista = candidatos(plan, item)

  if (esLibre(item)) {
    const elegidos = Array.isArray(seleccion) ? seleccion : []
    const toggle = (id: string) =>
      onCambiar(elegidos.includes(id) ? elegidos.filter((e) => e !== id) : [...elegidos, id])
    return (
      <div className="selector">
        <div className="chips">
          {lista.map((a) => (
            <button
              key={a.id}
              className={`chip ${elegidos.includes(a.id) ? 'chip--activo' : ''}`}
              onClick={() => toggle(a.id)}
            >
              {a.favorito && '★ '}
              {a.nombre}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const sugeridos = item.sugeridos ?? []
  const destacados = lista.filter(
    (a) => !esOtroNivel(item, a) && vaEnComida(a, comidaId) && (a.favorito || sugeridos.includes(a.id)),
  )
  const otros = lista.filter((a) => !esOtroNivel(item, a) && !destacados.includes(a))
  const otroNivel = lista.filter((a) => esOtroNivel(item, a))

  const seccion = (titulo: string, alimentos: Alimento[]) =>
    alimentos.length > 0 && (
      <div className="selector__seccion">
        <h4>{titulo}</h4>
        {alimentos.map((a) => (
          <button
            key={a.id}
            className={`opcion ${seleccion === a.id ? 'opcion--activa' : ''}`}
            onClick={() => onCambiar(a.id)}
          >
            <span>
              {a.favorito && '★ '}
              {a.nombre}
            </span>
            {a.aviso && <span className="opcion__aviso">{plan.avisos[a.aviso] ?? a.aviso}</span>}
          </button>
        ))}
      </div>
    )

  return (
    <div className="selector">
      {seccion('Favoritos y sugeridos', destacados)}
      {seccion('Otras opciones', otros)}
      {seccion('Otro nivel de proteína (se convierte la cantidad)', otroNivel)}
    </div>
  )
}
