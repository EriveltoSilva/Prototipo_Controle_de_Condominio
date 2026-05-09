import { useEffect, useState } from 'react'
import { Settings, X } from 'lucide-react'
import { Button } from './ui/button'

// ─── localStorage helpers ──────────────────────────────────────────────────

const STORAGE_KEY = 'kilamba.reservoir.config'

export interface ReservoirConfig {
  maxHeight: number  // physical height of the reservoir in cm
  numPoints: number  // number of milestone control points
}

export function loadReservoirConfig(): ReservoirConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as ReservoirConfig
      if (p.maxHeight > 0 && p.numPoints >= 2) return p
    }
  } catch { /* ignore */ }
  return { maxHeight: 50, numPoints: 5 }
}

export function saveReservoirConfig(cfg: ReservoirConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  config: ReservoirConfig
  onSave: (cfg: ReservoirConfig) => void
}

export function ReservoirConfigDialog({ open, onClose, config, onSave }: Props) {
  const [maxHeight, setMaxHeight] = useState(config.maxHeight)
  const [numPoints, setNumPoints] = useState(config.numPoints)

  // Sync inputs when dialog reopens
  useEffect(() => {
    if (open) { setMaxHeight(config.maxHeight); setNumPoints(config.numPoints) }
  }, [open, config])

  const spacing = maxHeight > 0 && numPoints >= 2 ? maxHeight / numPoints : 0

  const milestones = spacing > 0
    ? Array.from({ length: numPoints }, (_, i) => ({
        index: i + 1,
        cm: ((i + 1) * spacing).toFixed(1),
        pct: Math.round(((i + 1) / numPoints) * 100)
      }))
    : []

  function handleSave() {
    const cfg: ReservoirConfig = { maxHeight, numPoints }
    saveReservoirConfig(cfg)
    onSave(cfg)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[500px] rounded-xl border border-border bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Configurar Reservatório</span>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">

          {/* Max height */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Altura Máxima do Reservatório (cm)
            </label>
            <input
              type="number"
              min={10}
              max={500}
              value={maxHeight}
              onChange={(e) => setMaxHeight(Math.max(10, Number(e.target.value)))}
              className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Medida real da altura interior do reservatório (ex: 50 cm).
            </p>
          </div>

          {/* Num points */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Número de Pontos de Controlo
            </label>
            <input
              type="number"
              min={2}
              max={20}
              value={numPoints}
              onChange={(e) => setNumPoints(Math.max(2, Math.min(20, Number(e.target.value))))}
              className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Número de marcações visuais que dividem o reservatório.
            </p>
          </div>

          {/* Preview */}
          {spacing > 0 && (
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Espaçamento calculado:{' '}
                <span className="font-semibold text-foreground">
                  {spacing.toFixed(1)} cm
                </span>{' '}
                por ponto
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded px-2 py-0.5 text-xs bg-secondary text-muted-foreground">
                  0 cm · 0%
                </span>
                {milestones.map((m) => (
                  <span
                    key={m.index}
                    className="rounded px-2 py-0.5 text-xs bg-blue-900/50 text-blue-300"
                  >
                    {m.cm} cm · {m.pct}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={spacing <= 0}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}
