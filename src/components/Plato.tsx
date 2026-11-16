import { caminoSector, centroEtiqueta, CENTRO, esSatelite, RADIO, sectoresDe, type Sector } from '../lib/geometria'
import type { LineaPlato, PlatoCalculado } from '../lib/plato'
import { esFijo, esLibre, type Alimento, type Plan, type Variante } from '../types'

interface Props {
  plan: Plan
  variante: Variante
  calculado: PlatoCalculado
  activo: number | null
  onAbrir: (i: number) => void
}

export const nombreCorto = (a: Alimento) => a.nombre.split(' (')[0]

const emojiDe = (a?: Alimento) => a?.emoji ?? '🍽️'

function colorDe(plan: Plan, linea: LineaPlato) {
  const item = linea.item
  const grupo = esFijo(item) ? linea.alimento?.grupo : item.grupo
  return plan.grupos.find((g) => g.id === grupo)?.color ?? '#ddd'
}

export function Plato({ plan, variante, calculado, activo, onAbrir }: Props) {
  const sectores = sectoresDe(variante)
  const satelites = variante.items.map((_, i) => i).filter((i) => esSatelite(variante.items[i]))

  return (
    <div className="mesa">
      <div className="plato-svg">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <pattern id="rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="rayado" strokeWidth="2" />
            </pattern>
          </defs>
          <circle cx={CENTRO} cy={CENTRO} r={97} className="plato-borde" />
          <circle cx={CENTRO} cy={CENTRO} r={RADIO + 4} className="plato-interior" />
          {sectores.map((s, k) => (
            <FormaSector key={k} s={s} color={s.index !== null ? colorDe(plan, calculado.lineas[s.index]) : undefined} activo={s.index !== null && s.index === activo} />
          ))}
        </svg>
        {sectores.map((s, k) => (
          <EtiquetaSector key={k} s={s} linea={s.index !== null ? calculado.lineas[s.index] : undefined} onAbrir={onAbrir} />
        ))}
      </div>

      {satelites.length > 0 && (
        <div className="satelites">
          {satelites.map((i) => {
            const linea = calculado.lineas[i]
            const fijo = esFijo(linea.item)
            const contenido = (
              <>
                <span className="satelite__emoji">{emojiDe(linea.alimento)}</span>
                <span className="satelite__texto">
                  <strong>{linea.alimento ? nombreCorto(linea.alimento) : 'Elegí'}</strong>
                  {!linea.cubierto && linea.cantidad && <span>{linea.cantidad}</span>}
                  {linea.cubierto && <span>Cubierto</span>}
                </span>
              </>
            )
            return fijo ? (
              <div key={i} className="satelite satelite--fijo">{contenido}</div>
            ) : (
              <button
                key={i}
                className={`satelite ${activo === i ? 'satelite--activo' : ''} ${linea.cubierto ? 'satelite--cubierto' : ''}`}
                style={{ ['--color-grupo' as string]: colorDe(plan, linea) }}
                onClick={() => onAbrir(i)}
              >
                {contenido}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FormaSector({ s, color, activo }: { s: Sector; color?: string; activo: boolean }) {
  const lleno = s.fin - s.inicio >= 359.9
  const props = {
    className: `sector ${activo ? 'sector--activo' : ''} ${s.vacio ? 'sector--vacio' : ''}`,
    style: { ['--color-grupo' as string]: color },
  }
  return lleno ? <circle cx={CENTRO} cy={CENTRO} r={RADIO} {...props} /> : <path d={caminoSector(s)} {...props} />
}

function EtiquetaSector({ s, linea, onAbrir }: { s: Sector; linea?: LineaPlato; onAbrir: (i: number) => void }) {
  const [x, y] = centroEtiqueta(s)
  const ancho = s.fin - s.inicio
  const estilo = {
    left: `${(x / 200) * 100}%`,
    top: `${(y / 200) * 100}%`,
    width: ancho >= 359 ? '60%' : ancho >= 180 ? '42%' : '34%',
  }

  if (!linea) {
    return (
      <div className="etiqueta etiqueta--vacia" style={estilo}>
        {s.vacio}
      </div>
    )
  }

  const item = linea.item
  const fijo = esFijo(item)
  let emojis: string
  let nombre: string
  let extra = ''
  if (esLibre(item)) {
    const lista = linea.alimentos ?? []
    extra = lista.length > 3 ? `+${lista.length - 3}` : ''
    emojis = lista.slice(0, 3).map((a) => emojiDe(a)).join('') || '🥗'
    nombre =
      lista.length === 0 ? 'Elegí verduras' : lista.length > 3 ? `${lista.length} verduras` : lista.map(nombreCorto).join(', ')
  } else {
    emojis = emojiDe(linea.alimento)
    nombre = linea.alimento ? nombreCorto(linea.alimento) : 'Elegí'
  }
  const tieneAviso = linea.avisos.length > 0

  const contenido = (
    <>
      <span className="etiqueta__emoji">
        {emojis}
        {extra && <span className="etiqueta__extra">{extra}</span>}
      </span>
      <span className="etiqueta__nombre">{nombre}</span>
      <span className="etiqueta__cantidad">{linea.cubierto ? linea.notas[0] ?? 'Cubierto' : linea.cantidad}</span>
      {tieneAviso && <span className="etiqueta__alerta" aria-label="Tiene avisos">⚠</span>}
    </>
  )

  if (fijo) return <div className="etiqueta" style={estilo}>{contenido}</div>

  const grupoTexto = esLibre(item) ? 'verduras' : linea.alimento?.grupo ?? item.grupo
  return (
    <button
      className={`etiqueta etiqueta--boton ${linea.cubierto ? 'etiqueta--cubierta' : ''}`}
      style={estilo}
      onClick={() => onAbrir(s.index!)}
      aria-label={`Cambiar ${grupoTexto}: ${nombre}`}
    >
      {contenido}
    </button>
  )
}
