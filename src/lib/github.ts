import type { Plan } from '../types'

const REPO = 'emanuelramponi/plan_nutri'
const RUTA = 'data/plan.json'
const RAMA = 'main'
const URL_ARCHIVO = `https://api.github.com/repos/${REPO}/contents/${RUTA}`
const CLAVE_TOKEN = 'plan-nutri:token'

export const URL_CREAR_TOKEN = 'https://github.com/settings/personal-access-tokens/new'

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

export function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token)
    else localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    /* sin storage */
  }
}

function aBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

function deBase64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export class ErrorGithub extends Error {
  constructor(
    message: string,
    public tipo: 'token' | 'conflicto' | 'red',
  ) {
    super(message)
  }
}

const cabeceras = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

export async function leerPlanConSha(token: string): Promise<{ plan: Plan; sha: string }> {
  let res: Response
  try {
    res = await fetch(`${URL_ARCHIVO}?ref=${RAMA}`, { headers: cabeceras(token), cache: 'no-store' })
  } catch {
    throw new ErrorGithub('No hay conexión con GitHub.', 'red')
  }
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    throw new ErrorGithub('El token no es válido o no tiene acceso al repo plan_nutri.', 'token')
  }
  if (!res.ok) throw new ErrorGithub(`GitHub respondió ${res.status}.`, 'red')
  const datos = (await res.json()) as { content: string; sha: string }
  return { plan: JSON.parse(deBase64(datos.content)) as Plan, sha: datos.sha }
}

export async function guardarPlan(token: string, plan: Plan, sha: string, mensaje: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(URL_ARCHIVO, {
      method: 'PUT',
      headers: cabeceras(token),
      body: JSON.stringify({
        message: mensaje,
        content: aBase64(JSON.stringify(plan, null, 2) + '\n'),
        sha,
        branch: RAMA,
      }),
    })
  } catch {
    throw new ErrorGithub('No hay conexión con GitHub.', 'red')
  }
  if (res.status === 409 || res.status === 422) {
    throw new ErrorGithub('El plan cambió desde otro dispositivo. Recargá el editor y volvé a hacer los cambios.', 'conflicto')
  }
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    throw new ErrorGithub('El token no es válido o no tiene permiso de escritura.', 'token')
  }
  if (!res.ok) throw new ErrorGithub(`GitHub respondió ${res.status}.`, 'red')
  const datos = (await res.json()) as { content: { sha: string } }
  return datos.content.sha
}
