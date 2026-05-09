import { Lightbulb, LightbulbOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { cn } from '@renderer/lib/utils'

interface Props {
  sl1: boolean
  sl2: boolean
  sl3: boolean
  connected: boolean
  onSend: (cmd: string, desc: string) => void
}

interface LightRowProps {
  label: string
  isOn: boolean
  cmdOn: string
  cmdOff: string
  connected: boolean
  onSend: (cmd: string, desc: string) => void
}

function LightRow({ label, isOn, cmdOn, cmdOff, connected, onSend }: LightRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Lightbulb
          className={cn(
            'h-4 w-4 transition-colors',
            isOn ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]' : 'text-gray-600'
          )}
        />
        <span className="text-sm">{label}</span>
      </div>
      <Switch
        checked={isOn}
        disabled={!connected}
        onCheckedChange={(on) =>
          onSend(on ? cmdOn : cmdOff, `${label} ${on ? 'ligada' : 'apagada'}`)
        }
      />
    </div>
  )
}

export function StreetlightPanel({ sl1, sl2, sl3, connected, onSend }: Props) {
  const allOn = sl1 && sl2 && sl3
  const allOff = !sl1 && !sl2 && !sl3

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iluminação Pública</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          <LightRow label="Luz de Rua 1" isOn={sl1} cmdOn="L1O" cmdOff="L1X" connected={connected} onSend={onSend} />
          <LightRow label="Luz de Rua 2" isOn={sl2} cmdOn="L2O" cmdOff="L2X" connected={connected} onSend={onSend} />
          <LightRow label="Luz de Rua 3" isOn={sl3} cmdOn="L3O" cmdOff="L3X" connected={connected} onSend={onSend} />
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            className="flex-1"
            variant={allOn ? 'secondary' : 'warning'}
            size="sm"
            disabled={!connected || allOn}
            onClick={() => onSend('LOO', 'Todas as luzes ligadas')}
          >
            <Lightbulb className="h-3.5 w-3.5" /> Ligar Todas
          </Button>
          <Button
            className="flex-1"
            variant={allOff ? 'secondary' : 'outline'}
            size="sm"
            disabled={!connected || allOff}
            onClick={() => onSend('LXX', 'Todas as luzes apagadas')}
          >
            <LightbulbOff className="h-3.5 w-3.5" /> Apagar Todas
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
