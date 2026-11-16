export type GrupoId = 'hc' | 'proteina' | 'fibra' | 'grasa' | 'otros'
export type NivelProteina = 'alta' | 'media'
export type TipoFibra = 'fruta' | 'verdura'

export interface Porcion {
  cantidad: number
  unidad: string
  gramos?: number
}

export interface Ocupa {
  grupo: GrupoId
  porciones: number
  aviso?: string
  nota?: string
}

export interface Alimento {
  id: string
  nombre: string
  emoji?: string
  grupo: GrupoId
  nivel?: NivelProteina
  tipo?: TipoFibra
  grupoVegetal?: 'A' | 'B'
  porcion?: Porcion
  favorito?: boolean
  aviso?: string
  nota?: string
  ocupa?: Ocupa[]
  momentos?: string[]
}

export interface NivelInfo {
  id: NivelProteina
  nombre: string
  gramosProteina: number
}

export interface Grupo {
  id: GrupoId
  nombre: string
  color: string
  nota?: string
  niveles?: NivelInfo[]
}

export interface ItemGrupo {
  grupo: GrupoId
  nivel?: NivelProteina
  tipo?: TipoFibra
  porciones: number
  sugeridos?: string[]
}

export interface ItemLibre {
  grupo: GrupoId
  tipo?: TipoFibra
  libre: string
  sugerirCantidad?: number
}

export interface ItemFijo {
  fijo: string
}

export type ItemComida = ItemGrupo | ItemLibre | ItemFijo

export interface Variante {
  id: string
  nombre: string
  items: ItemComida[]
}

export interface Comida {
  id: string
  nombre: string
  variantes: Variante[]
}

export interface Plan {
  version: string
  reglas: {
    conversionEntreNivelesProteina?: string
    frutaSoloPorFruta?: boolean
    verduraSoloPorVerdura?: boolean
    priorizarFavoritos?: boolean
    avisarSiOcupaGrupoAusente?: boolean
  }
  grupos: Grupo[]
  avisos: Record<string, string>
  alimentos: Alimento[]
  comidas: Comida[]
}

export type Seleccion = string | string[] | null

export const esFijo = (i: ItemComida): i is ItemFijo => 'fijo' in i
export const esLibre = (i: ItemComida): i is ItemLibre => 'libre' in i
export const esGrupo = (i: ItemComida): i is ItemGrupo => !esFijo(i) && !esLibre(i)
