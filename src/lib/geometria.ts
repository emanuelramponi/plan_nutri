import { esFijo, esLibre, type ItemComida, type ItemGrupo, type Variante } from '../types'

export interface Sector {
  index: number | null
  inicio: number
  fin: number
  vacio?: string
}

export const CENTRO = 100
export const RADIO = 82

export function punto(r: number, grados: number): [number, number] {
  const rad = (grados * Math.PI) / 180
  return [CENTRO + r * Math.sin(rad), CENTRO - r * Math.cos(rad)]
}

export function caminoSector(s: Sector, r = RADIO): string {
  if (s.fin - s.inicio >= 359.9) return ''
  const [x1, y1] = punto(r, s.inicio)
  const [x2, y2] = punto(r, s.fin)
  const grande = s.fin - s.inicio > 180 ? 1 : 0
  return `M ${CENTRO} ${CENTRO} L ${x1} ${y1} A ${r} ${r} 0 ${grande} 1 ${x2} ${y2} Z`
}

export function centroEtiqueta(s: Sector): [number, number] {
  const ancho = s.fin - s.inicio
  if (ancho >= 359.9) return [CENTRO, CENTRO]
  const r = ancho >= 180 ? RADIO * 0.48 : RADIO * 0.56
  return punto(r, (s.inicio + s.fin) / 2)
}

export const esSatelite = (i: ItemComida) =>
  (esFijo(i) && i.fijo === 'infusion') || (!esFijo(i) && i.grupo === 'grasa')

export function sectoresDe(variante: Variante): Sector[] {
  const indices = variante.items.map((_, i) => i).filter((i) => !esSatelite(variante.items[i]))
  const verdura = indices.find((i) => {
    const it = variante.items[i]
    return esLibre(it) && it.tipo === 'verdura'
  })

  if (verdura !== undefined) {
    const buscar = (g: string) =>
      indices.find((i) => {
        const it = variante.items[i]
        return !esFijo(it) && !esLibre(it) && (it as ItemGrupo).grupo === g
      })
    const proteina = buscar('proteina')
    const hc = buscar('hc')
    const resto = indices.filter((i) => i !== verdura && i !== proteina && i !== hc)
    if (resto.length === 0) {
      return [
        { index: verdura, inicio: 180, fin: 360 },
        proteina !== undefined ? { index: proteina, inicio: 0, fin: 90 } : { index: null, inicio: 0, fin: 90, vacio: 'Sin proteína' },
        hc !== undefined ? { index: hc, inicio: 90, fin: 180 } : { index: null, inicio: 90, fin: 180, vacio: 'Sin carbohidrato' },
      ]
    }
  }

  const paso = 360 / Math.max(indices.length, 1)
  return indices.map((index, k) => ({ index, inicio: k * paso, fin: (k + 1) * paso }))
}
