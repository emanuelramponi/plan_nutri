import {
  esFijo,
  esGrupo,
  esLibre,
  type Alimento,
  type ItemComida,
  type ItemGrupo,
  type ItemLibre,
  type NivelProteina,
  type Plan,
  type Seleccion,
  type Variante,
} from '../types'
import { formatearCantidad } from './formato'

export interface LineaPlato {
  item: ItemComida
  alimento?: Alimento
  alimentos?: Alimento[]
  cantidad?: string
  gramos?: string
  avisos: string[]
  notas: string[]
  cubierto?: boolean
}

export interface PlatoCalculado {
  lineas: LineaPlato[]
  avisosGenerales: string[]
}

const gramosProteina = (plan: Plan, nivel: NivelProteina): number =>
  plan.grupos.find((g) => g.id === 'proteina')?.niveles?.find((n) => n.id === nivel)?.gramosProteina ?? 1

export const buscarAlimento = (plan: Plan, id: string) => plan.alimentos.find((a) => a.id === id)

export const nombreGrupo = (plan: Plan, id: string) => plan.grupos.find((g) => g.id === id)?.nombre ?? id

export function candidatos(plan: Plan, item: ItemGrupo | ItemLibre): Alimento[] {
  const sugeridos = 'sugeridos' in item ? item.sugeridos ?? [] : []
  const nivel = 'nivel' in item ? item.nivel : undefined
  const lista = plan.alimentos.filter(
    (a) => a.grupo === item.grupo && (!item.tipo || a.tipo === item.tipo),
  )
  const puntaje = (a: Alimento) =>
    (nivel && a.nivel && a.nivel !== nivel ? 100 : 0) -
    (sugeridos.includes(a.id) ? 2 : 0) -
    (a.favorito ? 1 : 0)
  return lista.sort((a, b) => puntaje(a) - puntaje(b) || a.nombre.localeCompare(b.nombre))
}

export const esOtroNivel = (item: ItemComida, a: Alimento) =>
  esGrupo(item) && !!item.nivel && !!a.nivel && item.nivel !== a.nivel

function elegirPonderado<T>(opciones: { valor: T; peso: number }[]): T | null {
  const total = opciones.reduce((s, o) => s + o.peso, 0)
  if (total <= 0) return null
  let r = Math.random() * total
  for (const o of opciones) {
    r -= o.peso
    if (r <= 0) return o.valor
  }
  return opciones[opciones.length - 1].valor
}

const gruposDeVariante = (v: Variante) =>
  new Set(v.items.filter((i) => !esFijo(i)).map((i) => (i as ItemGrupo).grupo))

export const vaEnComida = (a: Alimento, comidaId: string) => !a.momentos || a.momentos.includes(comidaId)

export function armarPlato(plan: Plan, comidaId: string, variante: Variante): Seleccion[] {
  const presentes = gruposDeVariante(variante)
  const priorizar = plan.reglas.priorizarFavoritos !== false

  return variante.items.map((item) => {
    if (esFijo(item)) return null

    const opciones = candidatos(plan, item).filter(
      (a) =>
        vaEnComida(a, comidaId) &&
        a.aviso !== 'evitar' &&
        !(a.ocupa ?? []).some((o) => !presentes.has(o.grupo)),
    )

    if (esLibre(item)) {
      if (item.porDefecto?.length) return [...item.porDefecto]
      const cant = item.sugerirCantidad ?? 3
      const elegidos: string[] = []
      let pool = opciones.map((a) => ({ valor: a.id, peso: priorizar && a.favorito ? 4 : 1 }))
      while (elegidos.length < cant && pool.length) {
        const id = elegirPonderado(pool)
        if (!id) break
        elegidos.push(id)
        pool = pool.filter((p) => p.valor !== id)
      }
      return elegidos
    }

    const sugeridos = item.sugeridos ?? []
    const pesos = opciones
      .map((a) => {
        if (esOtroNivel(item, a)) return { valor: a.id, peso: priorizar && a.favorito ? 0.5 : 0 }
        let peso = 1
        if (priorizar && a.favorito) peso += 3
        if (sugeridos.includes(a.id)) peso += 3
        return { valor: a.id, peso }
      })
      .filter((p) => p.peso > 0)
    return elegirPonderado(pesos)
  })
}

export function calcularPlato(plan: Plan, variante: Variante, seleccion: Seleccion[]): PlatoCalculado {
  const avisosGenerales: string[] = []
  const porciones = variante.items.map((i) => (esGrupo(i) ? i.porciones : 0))
  const notasPorLinea: string[][] = variante.items.map(() => [])
  const avisosPorLinea: string[][] = variante.items.map(() => [])

  variante.items.forEach((item, i) => {
    const sel = seleccion[i]
    if (!esGrupo(item) || typeof sel !== 'string') return
    const alimento = buscarAlimento(plan, sel)
    for (const o of alimento?.ocupa ?? []) {
      const j = variante.items.findIndex((it, k) => k !== i && esGrupo(it) && it.grupo === o.grupo)
      if (o.nota) notasPorLinea[i].push(o.nota)
      if (o.aviso) avisosPorLinea[i].push(plan.avisos[o.aviso] ?? o.aviso)
      if (j >= 0) {
        porciones[j] = Math.max(0, porciones[j] - o.porciones)
        notasPorLinea[j].push(`Cubierto por ${alimento!.nombre.toLowerCase()}`)
      } else if (plan.reglas.avisarSiOcupaGrupoAusente) {
        avisosGenerales.push(
          `${alimento!.nombre} aporta ${nombreGrupo(plan, o.grupo).toLowerCase()}, que no va en esta comida.`,
        )
      }
    }
  })

  const lineas = variante.items.map((item, i): LineaPlato => {
    const sel = seleccion[i]
    if (esFijo(item)) {
      const a = buscarAlimento(plan, item.fijo)
      return { item, alimento: a, cantidad: a?.porcion ? formatearCantidad(a.porcion.cantidad, a.porcion.unidad) : undefined, avisos: [], notas: [] }
    }
    if (esLibre(item)) {
      const ids = Array.isArray(sel) ? sel : []
      return {
        item,
        alimentos: ids.map((id) => buscarAlimento(plan, id)).filter((a): a is Alimento => !!a),
        cantidad: item.libre,
        avisos: [],
        notas: [],
      }
    }
    const alimento = typeof sel === 'string' ? buscarAlimento(plan, sel) : undefined
    const avisos = [...avisosPorLinea[i]]
    const notas = [...notasPorLinea[i]]
    if (!alimento) return { item, avisos, notas }

    let mult = porciones[i]
    const cubierto = mult === 0
    const convertido = esOtroNivel(item, alimento)
    if (convertido) {
      mult = (mult * gramosProteina(plan, item.nivel!)) / gramosProteina(plan, alimento.nivel!)
      avisos.push(plan.avisos['conversion-nivel'] ?? 'Cantidad convertida')
    }
    if (alimento.aviso) avisos.push(plan.avisos[alimento.aviso] ?? alimento.aviso)
    if (alimento.nota) notas.push(alimento.nota)

    let cantidad: string | undefined
    let gramos: string | undefined
    if (alimento.porcion && !cubierto) {
      const p = alimento.porcion
      let total = p.cantidad * mult
      if (convertido && p.unidad !== 'g' && !Number.isInteger(Math.round(total * 4) / 4)) {
        cantidad = `${Math.floor(total)}-${formatearCantidad(Math.ceil(total), p.unidad)}`
      } else {
        total = p.unidad === 'g' ? Math.round(total / 10) * 10 : Math.round(total * 4) / 4
        cantidad = formatearCantidad(total, p.unidad)
      }
      if (p.gramos && p.unidad !== 'g') gramos = `≈ ${Math.round(p.gramos * mult)} g`
    }
    return { item, alimento, cantidad, gramos, avisos, notas, cubierto }
  })

  return { lineas, avisosGenerales }
}
