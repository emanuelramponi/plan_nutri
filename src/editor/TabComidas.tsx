import { useState } from 'react'
import { crearId } from '../lib/validar'
import {
  esFijo,
  esLibre,
  type Alimento,
  type Comida,
  type GrupoId,
  type ItemComida,
  type NivelProteina,
  type Plan,
  type TipoFibra,
  type Variante,
} from '../types'
import { SelectorAlimentos } from './SelectorAlimentos'

interface Props {
  plan: Plan
  onCambiar: (p: Plan) => void
}

interface Picker {
  titulo: string
  alimentos: Alimento[]
  seleccion: string[]
  multiple: boolean
  aplicar: (ids: string[]) => void
}

export function TabComidas({ plan, onCambiar }: Props) {
  const [abierta, setAbierta] = useState<string | null>(plan.comidas[0]?.id ?? null)
  const [picker, setPicker] = useState<Picker | null>(null)

  const cambiarComida = (ci: number, c: Comida) =>
    onCambiar({ ...plan, comidas: plan.comidas.map((x, k) => (k === ci ? c : x)) })

  const cambiarVariante = (ci: number, vi: number, v: Variante) => {
    const c = plan.comidas[ci]
    cambiarComida(ci, { ...c, variantes: c.variantes.map((x, k) => (k === vi ? v : x)) })
  }

  const cambiarItem = (ci: number, vi: number, ii: number, it: ItemComida) => {
    const v = plan.comidas[ci].variantes[vi]
    cambiarVariante(ci, vi, { ...v, items: v.items.map((x, k) => (k === ii ? it : x)) })
  }

  const moverItem = (ci: number, vi: number, ii: number, dir: -1 | 1) => {
    const v = plan.comidas[ci].variantes[vi]
    const items = [...v.items]
    const j = ii + dir
    if (j < 0 || j >= items.length) return
    ;[items[ii], items[j]] = [items[j], items[ii]]
    cambiarVariante(ci, vi, { ...v, items })
  }

  const quitarItem = (ci: number, vi: number, ii: number) => {
    const v = plan.comidas[ci].variantes[vi]
    cambiarVariante(ci, vi, { ...v, items: v.items.filter((_, k) => k !== ii) })
  }

  const agregarItem = (ci: number, vi: number, tipo: 'grupo' | 'libre' | 'fijo') => {
    const v = plan.comidas[ci].variantes[vi]
    const nuevo: ItemComida =
      tipo === 'grupo'
        ? { grupo: 'hc', porciones: 1, sugeridos: [] }
        : tipo === 'libre'
          ? { grupo: 'fibra', tipo: 'verdura', libre: 'medio plato', sugerirCantidad: 3 }
          : { fijo: 'infusion' }
    cambiarVariante(ci, vi, { ...v, items: [...v.items, nuevo] })
  }

  const agregarVariante = (ci: number) => {
    const c = plan.comidas[ci]
    const id = crearId('variante', new Set(c.variantes.map((v) => v.id)))
    cambiarComida(ci, { ...c, variantes: [...c.variantes, { id, nombre: 'Nueva variante', items: [] }] })
  }

  const quitarVariante = (ci: number, vi: number) => {
    const c = plan.comidas[ci]
    cambiarComida(ci, { ...c, variantes: c.variantes.filter((_, k) => k !== vi) })
  }

  const agregarComida = () => {
    const id = crearId('comida', new Set(plan.comidas.map((c) => c.id)))
    onCambiar({
      ...plan,
      comidas: [...plan.comidas, { id, nombre: 'Nueva comida', variantes: [{ id: 'plan', nombre: 'Plato del plan', items: [] }] }],
    })
    setAbierta(id)
  }

  const quitarComida = (ci: number) => onCambiar({ ...plan, comidas: plan.comidas.filter((_, k) => k !== ci) })

  const alimentosDe = (grupo: GrupoId, tipo?: TipoFibra) =>
    plan.alimentos.filter((a) => a.grupo === grupo && (!tipo || a.tipo === tipo))

  const nombreDe = (id: string) => {
    const a = plan.alimentos.find((x) => x.id === id)
    return a ? `${a.emoji ?? ''} ${a.nombre}`.trim() : `⚠ ${id}`
  }

  return (
    <div className="tab">
      {plan.comidas.map((c, ci) => (
        <section key={c.id} className="bloque">
          <button className="bloque__cabecera" onClick={() => setAbierta(abierta === c.id ? null : c.id)} aria-expanded={abierta === c.id}>
            <strong>{c.nombre}</strong>
            <span>{c.variantes.length} {c.variantes.length === 1 ? 'variante' : 'variantes'} {abierta === c.id ? '▴' : '▾'}</span>
          </button>

          {abierta === c.id && (
            <div className="bloque__cuerpo">
              <label className="campo">
                <span>Nombre de la comida</span>
                <input value={c.nombre} onChange={(e) => cambiarComida(ci, { ...c, nombre: e.target.value })} />
              </label>

              {c.variantes.map((v, vi) => (
                <div key={v.id} className="variante-editor">
                  <div className="form__fila">
                    <label className="campo campo--flex">
                      <span>Variante</span>
                      <input value={v.nombre} onChange={(e) => cambiarVariante(ci, vi, { ...v, nombre: e.target.value })} />
                    </label>
                    {c.variantes.length > 1 && (
                      <button className="boton-icono" onClick={() => quitarVariante(ci, vi)} aria-label={`Quitar variante ${v.nombre}`}>
                        🗑
                      </button>
                    )}
                  </div>

                  {v.items.map((it, ii) => (
                    <div key={ii} className="parte" style={{ ['--color-grupo' as string]: plan.grupos.find((g) => g.id === (esFijo(it) ? 'otros' : it.grupo))?.color }}>
                      <div className="parte__acciones">
                        <span className="parte__tipo">{esFijo(it) ? 'Alimento fijo' : esLibre(it) ? 'Verduras libres' : 'Porción de grupo'}</span>
                        <button className="boton-icono" onClick={() => moverItem(ci, vi, ii, -1)} disabled={ii === 0} aria-label="Subir">↑</button>
                        <button className="boton-icono" onClick={() => moverItem(ci, vi, ii, 1)} disabled={ii === v.items.length - 1} aria-label="Bajar">↓</button>
                        <button className="boton-icono" onClick={() => quitarItem(ci, vi, ii)} aria-label="Quitar parte">🗑</button>
                      </div>

                      {esFijo(it) ? (
                        <button
                          className="selector-boton"
                          onClick={() =>
                            setPicker({
                              titulo: 'Alimento fijo',
                              alimentos: plan.alimentos,
                              seleccion: [it.fijo],
                              multiple: false,
                              aplicar: (ids) => cambiarItem(ci, vi, ii, { fijo: ids[0] }),
                            })
                          }
                        >
                          {nombreDe(it.fijo)} <span>Cambiar</span>
                        </button>
                      ) : esLibre(it) ? (
                        <>
                          <div className="form__fila">
                            <label className="campo campo--flex">
                              <span>Cantidad (texto)</span>
                              <input value={it.libre} onChange={(e) => cambiarItem(ci, vi, ii, { ...it, libre: e.target.value })} />
                            </label>
                          </div>
                          <button
                            className="selector-boton"
                            onClick={() =>
                              setPicker({
                                titulo: 'Verduras por defecto',
                                alimentos: alimentosDe('fibra', 'verdura'),
                                seleccion: it.porDefecto ?? [],
                                multiple: true,
                                aplicar: (ids) => cambiarItem(ci, vi, ii, { ...it, porDefecto: ids.length ? ids : undefined }),
                              })
                            }
                          >
                            <span className="selector-boton__texto">
                              <small>Por defecto</small>
                              {(it.porDefecto ?? []).map(nombreDe).join(', ') || 'Al azar'}
                            </span>
                            <span>Cambiar</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="form__fila">
                            <label className="campo campo--flex">
                              <span>Grupo</span>
                              <select
                                value={it.grupo}
                                onChange={(e) => {
                                  const grupo = e.target.value as GrupoId
                                  cambiarItem(ci, vi, ii, {
                                    grupo,
                                    porciones: it.porciones,
                                    sugeridos: [],
                                    ...(grupo === 'proteina' ? { nivel: 'alta' as NivelProteina } : {}),
                                    ...(grupo === 'fibra' ? { tipo: 'fruta' as TipoFibra } : {}),
                                  })
                                }}
                              >
                                {plan.grupos.filter((g) => g.id !== 'otros').map((g) => (
                                  <option key={g.id} value={g.id}>{g.nombre}</option>
                                ))}
                              </select>
                            </label>
                            <label className="campo campo--chico">
                              <span>Porciones</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.5"
                                min="0"
                                value={it.porciones}
                                onChange={(e) => cambiarItem(ci, vi, ii, { ...it, porciones: Number(e.target.value) })}
                              />
                            </label>
                          </div>
                          {it.grupo === 'proteina' && (
                            <label className="campo">
                              <span>Nivel</span>
                              <select value={it.nivel} onChange={(e) => cambiarItem(ci, vi, ii, { ...it, nivel: e.target.value as NivelProteina })}>
                                {plan.grupos.find((g) => g.id === 'proteina')?.niveles?.map((n) => (
                                  <option key={n.id} value={n.id}>{n.nombre}</option>
                                ))}
                              </select>
                            </label>
                          )}
                          {it.grupo === 'fibra' && (
                            <label className="campo">
                              <span>Tipo</span>
                              <select value={it.tipo} onChange={(e) => cambiarItem(ci, vi, ii, { ...it, tipo: e.target.value as TipoFibra, sugeridos: [] })}>
                                <option value="fruta">Fruta</option>
                                <option value="verdura">Verdura</option>
                              </select>
                            </label>
                          )}
                          <button
                            className="selector-boton"
                            onClick={() =>
                              setPicker({
                                titulo: 'Sugeridos',
                                alimentos: alimentosDe(it.grupo, it.tipo),
                                seleccion: it.sugeridos ?? [],
                                multiple: true,
                                aplicar: (ids) => cambiarItem(ci, vi, ii, { ...it, sugeridos: ids }),
                              })
                            }
                          >
                            <span className="selector-boton__texto">
                              <small>Sugeridos</small>
                              {(it.sugeridos ?? []).map(nombreDe).join(', ') || 'Ninguno'}
                            </span>
                            <span>Cambiar</span>
                          </button>
                          <div className="form__fila">
                            <button
                              className="selector-boton campo--flex"
                              onClick={() =>
                                setPicker({
                                  titulo: 'Por defecto',
                                  alimentos: it.soloSugeridos
                                    ? plan.alimentos.filter((a) => (it.sugeridos ?? []).includes(a.id))
                                    : alimentosDe(it.grupo, it.tipo),
                                  seleccion: it.porDefecto ? [it.porDefecto] : [],
                                  multiple: false,
                                  aplicar: (ids) => cambiarItem(ci, vi, ii, { ...it, porDefecto: ids[0] }),
                                })
                              }
                            >
                              <span className="selector-boton__texto">
                                <small>Por defecto</small>
                                {it.porDefecto ? nombreDe(it.porDefecto) : 'Al azar'}
                              </span>
                              <span>Cambiar</span>
                            </button>
                            {it.porDefecto && (
                              <button
                                className="boton-icono"
                                onClick={() => cambiarItem(ci, vi, ii, { ...it, porDefecto: undefined })}
                                aria-label="Quitar alimento por defecto"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={!!it.soloSugeridos}
                              onChange={(e) => cambiarItem(ci, vi, ii, { ...it, soloSugeridos: e.target.checked || undefined })}
                            />
                            Solo permitir los sugeridos
                          </label>
                        </>
                      )}
                    </div>
                  ))}

                  <div className="agregar-parte">
                    <span>Agregar:</span>
                    <button className="chip" onClick={() => agregarItem(ci, vi, 'grupo')}>+ Porción</button>
                    <button className="chip" onClick={() => agregarItem(ci, vi, 'libre')}>+ Verduras</button>
                    <button className="chip" onClick={() => agregarItem(ci, vi, 'fijo')}>+ Fijo</button>
                  </div>
                </div>
              ))}

              <div className="form__fila">
                <button className="boton-secundario" onClick={() => agregarVariante(ci)}>+ Agregar variante</button>
                <button className="boton-peligro" onClick={() => quitarComida(ci)}>Quitar comida</button>
              </div>
            </div>
          )}
        </section>
      ))}

      <button className="boton-agregar" onClick={agregarComida}>+ Nueva comida</button>

      {picker && (
        <SelectorAlimentos
          titulo={picker.titulo}
          alimentos={picker.alimentos}
          seleccion={picker.seleccion}
          multiple={picker.multiple}
          onCambiar={(ids) => {
            picker.aplicar(ids)
            setPicker((p) => (p ? { ...p, seleccion: ids } : p))
          }}
          onCerrar={() => setPicker(null)}
        />
      )}
    </div>
  )
}
