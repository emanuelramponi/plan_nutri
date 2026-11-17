import { useState } from 'react'
import { referenciasDe } from '../lib/validar'
import type { Alimento, GrupoId, Plan } from '../types'

interface Props {
  plan: Plan
  alimento: Alimento
  nuevo: boolean
  onGuardar: (a: Alimento) => void
  onBorrar: () => void
  onCerrar: () => void
}

const UNIDADES = ['g', 'unidad', 'unidad chica', 'rebanada', 'taza', 'cda', 'cdita', 'vaso', 'feta', 'scoop', 'porción']

export function FormAlimento({ plan, alimento, nuevo, onGuardar, onBorrar, onCerrar }: Props) {
  const [a, setA] = useState<Alimento>(alimento)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const set = (cambios: Partial<Alimento>) => setA((x) => ({ ...x, ...cambios }))

  const cambiarGrupo = (grupo: GrupoId) =>
    set({
      grupo,
      nivel: grupo === 'proteina' ? a.nivel ?? 'alta' : undefined,
      tipo: grupo === 'fibra' ? a.tipo ?? 'verdura' : undefined,
      grupoVegetal: grupo === 'fibra' ? a.grupoVegetal : undefined,
    })

  const tienePorcion = !!a.porcion
  const momentos = a.momentos ?? []
  const toggleMomento = (id: string) => {
    const nuevos = momentos.includes(id) ? momentos.filter((m) => m !== id) : [...momentos, id]
    set({ momentos: nuevos.length ? nuevos : undefined })
  }

  const referencias = referenciasDe(plan, a.id)

  return (
    <>
      <div className="panel-fondo" onClick={onCerrar} />
      <aside className="panel" role="dialog" aria-label={nuevo ? 'Nuevo alimento' : `Editar ${alimento.nombre}`}>
        <header className="panel__cabecera">
          <div>
            <h2>{nuevo ? 'Nuevo alimento' : 'Editar alimento'}</h2>
          </div>
          <button className="panel__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="panel__lista form">
          <div className="form__fila">
            <label className="campo campo--emoji">
              <span>Emoji</span>
              <input value={a.emoji ?? ''} onChange={(e) => set({ emoji: e.target.value || undefined })} maxLength={8} />
            </label>
            <label className="campo campo--flex">
              <span>Nombre</span>
              <input value={a.nombre} onChange={(e) => set({ nombre: e.target.value })} />
            </label>
          </div>

          <label className="campo">
            <span>Grupo</span>
            <select value={a.grupo} onChange={(e) => cambiarGrupo(e.target.value as GrupoId)}>
              {plan.grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </label>

          {a.grupo === 'proteina' && (
            <label className="campo">
              <span>Nivel de proteína</span>
              <select value={a.nivel} onChange={(e) => set({ nivel: e.target.value as Alimento['nivel'] })}>
                {plan.grupos.find((g) => g.id === 'proteina')?.niveles?.map((n) => (
                  <option key={n.id} value={n.id}>{n.nombre}</option>
                ))}
              </select>
            </label>
          )}

          {a.grupo === 'fibra' && (
            <div className="form__fila">
              <label className="campo campo--flex">
                <span>Tipo</span>
                <select value={a.tipo} onChange={(e) => set({ tipo: e.target.value as Alimento['tipo'] })}>
                  <option value="verdura">Verdura</option>
                  <option value="fruta">Fruta</option>
                </select>
              </label>
              {a.tipo === 'verdura' && (
                <label className="campo campo--flex">
                  <span>Grupo vegetal</span>
                  <select
                    value={a.grupoVegetal ?? ''}
                    onChange={(e) => set({ grupoVegetal: (e.target.value || undefined) as Alimento['grupoVegetal'] })}
                  >
                    <option value="">—</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </label>
              )}
            </div>
          )}

          <fieldset className="campo">
            <legend>Porción (equivale a 1 porción de la tabla)</legend>
            <label className="check">
              <input
                type="checkbox"
                checked={tienePorcion}
                onChange={(e) => set({ porcion: e.target.checked ? { cantidad: 1, unidad: 'unidad' } : undefined })}
              />
              Tiene porción definida
            </label>
            {a.porcion && (
              <div className="form__fila">
                <label className="campo campo--flex">
                  <span>Cantidad</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={a.porcion.cantidad}
                    onChange={(e) => set({ porcion: { ...a.porcion!, cantidad: Number(e.target.value) } })}
                  />
                </label>
                <label className="campo campo--flex">
                  <span>Unidad</span>
                  <input
                    list="unidades"
                    value={a.porcion.unidad}
                    onChange={(e) => set({ porcion: { ...a.porcion!, unidad: e.target.value } })}
                  />
                  <datalist id="unidades">
                    {UNIDADES.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </label>
                <label className="campo campo--flex">
                  <span>Gramos</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={a.porcion.gramos ?? ''}
                    onChange={(e) =>
                      set({ porcion: { ...a.porcion!, gramos: e.target.value ? Number(e.target.value) : undefined } })
                    }
                  />
                </label>
              </div>
            )}
          </fieldset>

          <fieldset className="campo">
            <legend>Referencia visual por porción (opcional, ej. 1 palma)</legend>
            <div className="form__fila">
              <label className="campo campo--chico">
                <span>Cantidad</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={a.referencia?.cantidad ?? ''}
                  onChange={(e) =>
                    set({
                      referencia: e.target.value
                        ? { unidad: a.referencia?.unidad ?? '', ...a.referencia, cantidad: Number(e.target.value) }
                        : undefined,
                    })
                  }
                />
              </label>
              <label className="campo campo--flex">
                <span>Unidad</span>
                <input
                  value={a.referencia?.unidad ?? ''}
                  placeholder="palma, papa chica…"
                  onChange={(e) => set({ referencia: { cantidad: a.referencia?.cantidad ?? 1, ...a.referencia, unidad: e.target.value } })}
                />
              </label>
              <label className="campo campo--flex">
                <span>Nota</span>
                <input
                  value={a.referencia?.nota ?? ''}
                  placeholder="(cocido)"
                  onChange={(e) =>
                    a.referencia && set({ referencia: { ...a.referencia, nota: e.target.value || undefined } })
                  }
                />
              </label>
            </div>
          </fieldset>

          <label className="check">
            <input type="checkbox" checked={!!a.favorito} onChange={(e) => set({ favorito: e.target.checked || undefined })} />
            ★ Favorito (el azar lo prioriza)
          </label>

          <label className="campo">
            <span>Aviso</span>
            <select value={a.aviso ?? ''} onChange={(e) => set({ aviso: e.target.value || undefined })}>
              <option value="">Sin aviso</option>
              {Object.entries(plan.avisos).map(([id, texto]) => (
                <option key={id} value={id}>{texto}</option>
              ))}
            </select>
          </label>

          <fieldset className="campo">
            <legend>¿En qué comidas va? (sin marcar = todas)</legend>
            <div className="chips">
              {plan.comidas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${momentos.includes(c.id) ? 'chip--activo' : ''}`}
                  onClick={() => toggleMomento(c.id)}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="campo">
            <span>Nota</span>
            <input value={a.nota ?? ''} onChange={(e) => set({ nota: e.target.value || undefined })} />
          </label>

          {!nuevo && (
            <div className="form__borrar">
              {!confirmarBorrado ? (
                <button className="boton-peligro" onClick={() => setConfirmarBorrado(true)}>
                  Borrar alimento
                </button>
              ) : (
                <div className="confirmar">
                  <p>
                    {referencias.length
                      ? `Se usa en: ${referencias.join(', ')}. Si lo borrás, se quita de ahí también.`
                      : '¿Seguro que querés borrarlo?'}
                  </p>
                  <div className="form__fila">
                    <button className="boton-secundario" onClick={() => setConfirmarBorrado(false)}>Cancelar</button>
                    <button className="boton-peligro" onClick={onBorrar}>Sí, borrar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="panel__listo"
          onClick={() => onGuardar(a.referencia && !a.referencia.unidad.trim() ? { ...a, referencia: undefined } : a)}
          disabled={!a.nombre.trim()}
        >
          {nuevo ? 'Agregar' : 'Aplicar cambios'}
        </button>
      </aside>
    </>
  )
}
