import { esFijo, esLibre, type Plan } from '../types'

export function validarPlan(plan: Plan): string[] {
  const errores: string[] = []
  const ids = new Set<string>()

  for (const a of plan.alimentos) {
    if (!a.nombre.trim()) errores.push(`Hay un alimento sin nombre (${a.id}).`)
    if (ids.has(a.id)) errores.push(`El id "${a.id}" está repetido.`)
    ids.add(a.id)
    if (a.grupo === 'proteina' && !a.nivel) errores.push(`${a.nombre}: falta el nivel de proteína.`)
    if (a.grupo === 'fibra' && !a.tipo) errores.push(`${a.nombre}: falta indicar si es fruta o verdura.`)
    if (a.porcion && !(a.porcion.cantidad > 0)) errores.push(`${a.nombre}: la cantidad de la porción tiene que ser mayor a 0.`)
    if (a.porcion && !a.porcion.unidad.trim()) errores.push(`${a.nombre}: falta la unidad de la porción.`)
  }

  if (plan.comidas.length === 0) errores.push('El plan no tiene ninguna comida.')
  for (const c of plan.comidas) {
    if (!c.nombre.trim()) errores.push(`Hay una comida sin nombre.`)
    if (c.variantes.length === 0) errores.push(`${c.nombre}: no tiene ninguna variante.`)
    for (const v of c.variantes) {
      const donde = `${c.nombre} › ${v.nombre}`
      if (v.items.length === 0) errores.push(`${donde}: no tiene partes.`)
      for (const it of v.items) {
        if (esFijo(it)) {
          if (!ids.has(it.fijo)) errores.push(`${donde}: el alimento fijo "${it.fijo}" no existe.`)
          continue
        }
        if (esLibre(it)) {
          for (const id of it.porDefecto ?? []) if (!ids.has(id)) errores.push(`${donde}: la verdura por defecto "${id}" no existe.`)
          continue
        }
        if (!(it.porciones > 0)) errores.push(`${donde}: las porciones tienen que ser mayores a 0.`)
        if (it.grupo === 'proteina' && !it.nivel) errores.push(`${donde}: falta el nivel de proteína.`)
        for (const id of it.sugeridos ?? []) if (!ids.has(id)) errores.push(`${donde}: el sugerido "${id}" no existe.`)
      }
    }
  }
  return errores
}

export function referenciasDe(plan: Plan, id: string): string[] {
  const refs: string[] = []
  for (const c of plan.comidas)
    for (const v of c.variantes)
      for (const it of v.items) {
        const usa = esFijo(it)
          ? it.fijo === id
          : esLibre(it)
            ? (it.porDefecto ?? []).includes(id)
            : (it.sugeridos ?? []).includes(id)
        if (usa) refs.push(`${c.nombre} › ${v.nombre}`)
      }
  return refs
}

export function quitarReferencias(plan: Plan, id: string): Plan {
  return {
    ...plan,
    comidas: plan.comidas.map((c) => ({
      ...c,
      variantes: c.variantes.map((v) => ({
        ...v,
        items: v.items
          .filter((it) => !(esFijo(it) && it.fijo === id))
          .map((it) => {
            if (esFijo(it)) return it
            if (esLibre(it)) return { ...it, porDefecto: it.porDefecto?.filter((x) => x !== id) }
            return { ...it, sugeridos: it.sugeridos?.filter((x) => x !== id) }
          }),
      })),
    })),
  }
}

export function crearId(texto: string, existentes: Set<string>): string {
  const base =
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  let id = base
  let n = 2
  while (existentes.has(id)) id = `${base}-${n++}`
  return id
}
