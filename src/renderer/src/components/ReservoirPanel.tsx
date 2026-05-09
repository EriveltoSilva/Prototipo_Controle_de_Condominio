import { useState } from 'react'
import { Settings, Droplets, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  ReservoirConfigDialog,
  loadReservoirConfig,
  saveReservoirConfig,
  type ReservoirConfig,
} from './ReservoirConfigDialog'
import { cn } from '@renderer/lib/utils'

// ─── Tank visual ───────────────────────────────────────────────────────────

const TANK_H = 200  // visual height in px
const TANK_W = 88   // visual width  in px

interface Milestone {
  heightCm: number
  pct: number        // % from bottom (0 = empty, 100 = full)
}

function TankVisual({
  fillPct,
  milestones,
  maxHeight,
  hasError,
}: {
  fillPct: number
  milestones: Milestone[]
  maxHeight: number
  hasError: boolean
}) {
  return (
    <div className="flex items-end gap-3">
      {/* Scale labels on the left */}
      <div className="relative shrink-0 text-right" style={{ height: TANK_H, width: 40 }}>
        <span className="absolute top-0 right-0 text-[10px] text-muted-foreground/50 leading-none">
          {maxHeight}cm
        </span>
        {milestones.slice(0, -1).map((m) => (
          <span
            key={m.pct}
            className="absolute right-0 text-[10px] text-muted-foreground/40 leading-none"
            style={{ bottom: `${m.pct}%`, transform: 'translateY(50%)' }}
          >
            {m.heightCm % 1 === 0 ? m.heightCm : m.heightCm.toFixed(1)}cm
          </span>
        ))}
        <span className="absolute bottom-0 right-0 text-[10px] text-muted-foreground/50 leading-none">
          0cm
        </span>
      </div>

      {/* Tank body */}
      <div
        className="relative shrink-0 rounded-b-xl border-2 border-blue-400/40 bg-slate-950/80 overflow-hidden"
        style={{ width: TANK_W, height: TANK_H }}
      >
        {/* Background grid lines */}
        {milestones.map((m) => (
          <div
            key={m.pct}
            className="absolute left-0 right-0 border-t border-dashed border-slate-700/40"
            style={{ bottom: `${m.pct}%` }}
          />
        ))}

        {/* Water fill */}
        {!hasError && (
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out"
            style={{
              height: `${fillPct}%`,
              background: 'linear-gradient(to top, rgb(29,78,216) 0%, rgb(59,130,246) 60%, rgb(96,165,250) 100%)',
              animation: 'water-rise 4s ease-in-out infinite',
            }}
          >
            {/* Wave at surface */}
            <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{ height: 8, marginTop: -4 }}>
              <div
                style={{
                  width: '200%',
                  height: '100%',
                  background:
                    'repeating-linear-gradient(to right, rgba(147,197,253,0.6) 0px, rgba(147,197,253,0) 14px, rgba(147,197,253,0.6) 28px)',
                  animation: 'wave-scroll 2.5s linear infinite',
                }}
              />
            </div>

            {/* Milestone lines colour change when submerged */}
            {milestones.map((m) => (
              <div
                key={m.pct}
                className="absolute left-0 right-0 border-t border-dashed border-blue-300/25"
                style={{ bottom: `${m.pct}%` }}
              />
            ))}
          </div>
        )}

        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <AlertTriangle className="h-7 w-7 text-red-400/60" />
            <span className="text-[11px] text-red-400/60 font-medium">ERRO</span>
          </div>
        )}

        {/* Percentage label */}
        {!hasError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className={cn(
                'text-base font-bold drop-shadow',
                fillPct > 45 ? 'text-white/90' : 'text-slate-400'
              )}
            >
              {fillPct.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Tick marks on the right */}
      <div className="relative shrink-0" style={{ height: TANK_H, width: 8 }}>
        <div className="absolute top-0 left-0 h-px w-full bg-muted-foreground/30" />
        {milestones.map((m) => (
          <div
            key={m.pct}
            className="absolute left-0 h-px w-full bg-muted-foreground/25"
            style={{ bottom: `${m.pct}%` }}
          />
        ))}
        <div className="absolute bottom-0 left-0 h-px w-full bg-muted-foreground/30" />
      </div>
    </div>
  )
}

// ─── Status helpers ─────────────────────────────────────────────────────────

type StatusVariant = 'success' | 'warning' | 'destructive' | 'secondary'

function statusFor(pct: number, hasError: boolean): { label: string; variant: StatusVariant } {
  if (hasError) return { label: 'ERRO SENSOR', variant: 'destructive' }
  if (pct >= 90) return { label: 'CHEIO',      variant: 'warning' }
  if (pct <= 10) return { label: 'VAZIO',       variant: 'destructive' }
  if (pct <= 25) return { label: 'BAIXO',       variant: 'warning' }
  return          { label: 'NORMAL',            variant: 'success' }
}

// ─── Main panel ─────────────────────────────────────────────────────────────

interface Props {
  wl: number   // HC-SR04 distance from sensor (top) to water surface, in cm
}

export function ReservoirPanel({ wl }: Props) {
  const [config, setConfig] = useState<ReservoirConfig>(loadReservoirConfig)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { maxHeight, numPoints } = config
  const spacing = maxHeight / numPoints

  // Water height from bottom = tank height minus air gap above water
  const hasError = wl <= 0
  const waterHeight = hasError ? 0 : Math.max(0, maxHeight - wl)
  const fillPct = hasError ? 0 : Math.min(100, (waterHeight / maxHeight) * 100)

  // Milestones: evenly spaced from bottom, excluding 0% and 100%
  const milestones: Milestone[] = Array.from({ length: numPoints - 1 }, (_, i) => ({
    heightCm: parseFloat(((i + 1) * spacing).toFixed(2)),
    pct: ((i + 1) / numPoints) * 100,
  }))

  const status = statusFor(fillPct, hasError)

  function handleSave(cfg: ReservoirConfig) {
    saveReservoirConfig(cfg)
    setConfig(cfg)
    setDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-blue-400" />
            Reservatório de Água
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDialogOpen(true)}
            title="Configurar reservatório"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>

        <CardContent>
          <div className="flex items-start gap-10">
            {/* Visual tank */}
            <TankVisual
              fillPct={fillPct}
              milestones={milestones}
              maxHeight={maxHeight}
              hasError={hasError}
            />

            {/* Info column */}
            <div className="flex flex-col gap-4 pt-1">

              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Nível actual</p>
                {hasError
                  ? <p className="text-2xl font-bold text-red-400">—</p>
                  : <p className="text-4xl font-bold tabular-nums">{fillPct.toFixed(1)}<span className="text-xl text-muted-foreground">%</span></p>
                }
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Altura de água</p>
                  <p className="font-medium">{hasError ? '—' : `${waterHeight.toFixed(1)} cm`}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Distância sensor</p>
                  <p className="font-medium">{hasError ? '—' : `${wl.toFixed(1)} cm`}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Capacidade total</p>
                  <p className="font-medium">{maxHeight} cm</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Espaçamento</p>
                  <p className="font-medium">{spacing.toFixed(1)} cm / ponto</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                <Badge variant={status.variant} className="text-xs px-2.5 py-1">
                  {status.label}
                </Badge>
              </div>

              {/* Milestone reference */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Pontos de controlo</p>
                <div className="flex flex-wrap gap-1">
                  {milestones.map((m) => (
                    <span
                      key={m.pct}
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-medium',
                        fillPct >= m.pct
                          ? 'bg-blue-900/60 text-blue-300'
                          : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {m.heightCm % 1 === 0 ? m.heightCm : m.heightCm.toFixed(1)} cm
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReservoirConfigDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        config={config}
        onSave={handleSave}
      />
    </>
  )
}
