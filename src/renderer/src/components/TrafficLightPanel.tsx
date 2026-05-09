import { Power, PowerOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '@renderer/lib/utils'
import type { TLColor } from '../../../../../types/board'

interface TrafficLightProps {
  id: string
  color: TLColor
  enabled: boolean
}

function TrafficLightVisual({ color, enabled }: { color: TLColor; enabled: boolean }) {
  const active = (c: TLColor) => enabled && color === c

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/60 px-4 py-3">
      <div className={cn('h-6 w-6 rounded-full transition-all duration-300',
        active('R') ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-gray-700/60')} />
      <div className={cn('h-6 w-6 rounded-full transition-all duration-300',
        active('Y') ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-gray-700/60')} />
      <div className={cn('h-6 w-6 rounded-full transition-all duration-300',
        active('G') ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-gray-700/60')} />
    </div>
  )
}

function colorLabel(c: TLColor) {
  if (c === 'R') return 'Vermelho'
  if (c === 'Y') return 'Amarelo'
  return 'Verde'
}

interface Props {
  tl1: TLColor
  tl2: TLColor
  enabled: boolean
  connected: boolean
  onSend: (cmd: string, desc: string) => void
}

export function TrafficLightPanel({ tl1, tl2, enabled, connected, onSend }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Semáforos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-around gap-4 pb-3">
          <div className="flex flex-col items-center gap-2">
            <TrafficLightVisual color={tl1} enabled={enabled} />
            <span className="text-xs text-muted-foreground">TL 1</span>
            {enabled && (
              <Badge variant={tl1 === 'G' ? 'success' : tl1 === 'Y' ? 'warning' : 'destructive'}>
                {colorLabel(tl1)}
              </Badge>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <TrafficLightVisual color={tl2} enabled={enabled} />
            <span className="text-xs text-muted-foreground">TL 2</span>
            {enabled && (
              <Badge variant={tl2 === 'G' ? 'success' : tl2 === 'Y' ? 'warning' : 'destructive'}>
                {colorLabel(tl2)}
              </Badge>
            )}
          </div>
        </div>

        {!enabled && (
          <p className="py-1 text-center text-xs text-muted-foreground">Desligados</p>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            className="flex-1"
            variant={enabled ? 'secondary' : 'success'}
            size="sm"
            disabled={!connected || enabled}
            onClick={() => onSend('TLO', 'Semáforos ligados')}
          >
            <Power className="h-3.5 w-3.5" /> Ligar
          </Button>
          <Button
            className="flex-1"
            variant={!enabled ? 'secondary' : 'destructive'}
            size="sm"
            disabled={!connected || !enabled}
            onClick={() => onSend('TLX', 'Semáforos desligados')}
          >
            <PowerOff className="h-3.5 w-3.5" /> Desligar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
