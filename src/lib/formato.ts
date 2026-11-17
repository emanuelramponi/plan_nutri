const FRACCIONES: [number, string][] = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [0.33, '⅓'],
  [0.5, '½'],
  [0.66, '⅔'],
  [0.75, '¾'],
]

const PLURALES: Record<string, string> = {
  rebanada: 'rebanadas',
  unidad: 'unidades',
  'unidad chica': 'unidades chicas',
  feta: 'fetas',
  cda: 'cdas',
  cdita: 'cditas',
  taza: 'tazas',
  vaso: 'vasos',
  scoop: 'scoops',
  rulo: 'rulos',
  casette: 'casettes',
  porción: 'porciones',
  planta: 'plantas',
  masa: 'masas',
  palma: 'palmas',
  'papa chica': 'papas chicas',
  'batata chica': 'batatas chicas',
  lata: 'latas',
  pote: 'potes',
  'cda sopera': 'cdas soperas',
  choclo: 'choclos',
}

export function formatearNumero(n: number): string {
  const entero = Math.floor(n + 1e-6)
  const resto = n - entero
  if (resto < 0.05) return String(entero)
  const frac = FRACCIONES.find(([v]) => Math.abs(v - resto) < 0.05)
  if (frac) return entero > 0 ? `${entero}${frac[1]}` : frac[1]
  return n.toFixed(1).replace('.', ',')
}

export function formatearCantidad(cantidad: number, unidad: string): string {
  if (unidad === 'g') return `${Math.round(cantidad)} g`
  const plural = cantidad > 1 && PLURALES[unidad] ? PLURALES[unidad] : unidad
  return `${formatearNumero(cantidad)} ${plural}`
}
