import { Flame, Wind, Droplets, CloudRain, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@renderer/lib/utils'

interface Props {
  sm: number
  fr: boolean
  wl: number
  rn: boolean
}

function waterStatus(dist: number): { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' } {
  if (dist <= 0) return { label: 'ERRO', variant: 'destructive' }
  if (dist < 5)  return { label: 'ALTO', variant: 'warning' }
  if (dist > 25) return { label: 'BAIXO', variant: 'destructive' }
  return { label: 'NORMAL', variant: 'success' }
}

function SmokeBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 1023) * 100)
  const danger = value >= 400
  return (
    <div className="mt-1 h-2 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          danger ? 'bg-orange-500' : 'bg-blue-500'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function SensorPanel({ sm, fr, wl, rn }: Props) {
  const smokeAlert = sm >= 400
  const ws = waterStatus(wl)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sensores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Fire */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={cn('h-4 w-4', fr ? 'text-red-500 animate-pulse' : 'text-muted-foreground')} />
            <span className="text-sm">Fogo</span>
          </div>
          {fr
            ? <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />DETECTADO</Badge>
            : <Badge variant="success"><ShieldCheck className="mr-1 h-3 w-3" />Seguro</Badge>
          }
        </div>

        {/* Smoke */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className={cn('h-4 w-4', smokeAlert ? 'text-orange-400' : 'text-muted-foreground')} />
              <span className="text-sm">Fumo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{sm}</span>
              {smokeAlert
                ? <Badge variant="warning">ALERTA</Badge>
                : <Badge variant="success">Normal</Badge>
              }
            </div>
          </div>
          <SmokeBar value={sm} />
        </div>

        {/* Water level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <span className="text-sm">Nível de Água</span>
          </div>
          <div className="flex items-center gap-2">
            {wl > 0 && <span className="text-xs text-muted-foreground">{wl.toFixed(1)} cm</span>}
            <Badge variant={ws.variant}>{ws.label}</Badge>
          </div>
        </div>

        {/* Rain */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className={cn('h-4 w-4', rn ? 'text-blue-400' : 'text-muted-foreground')} />
            <span className="text-sm">Chuva</span>
          </div>
          {rn
            ? <Badge variant="default">A chover</Badge>
            : <Badge variant="secondary">Sem chuva</Badge>
          }
        </div>

      </CardContent>
    </Card>
  )
}
