import planLocal from '../../data/plan.json'
import type { Plan } from '../types'

const REPO = 'emanuelramponi/plan_nutri'
const RUTA = 'data/plan.json'

export const planEmbebido = planLocal as Plan

export async function cargarPlanRemoto(): Promise<Plan | null> {
  if (import.meta.env.DEV) return null
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${RUTA}?ref=main`, {
      headers: { Accept: 'application/vnd.github.raw+json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as Plan
  } catch {
    return null
  }
}
