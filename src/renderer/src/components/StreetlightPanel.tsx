import { Lightbulb, LightbulbOff, SunMedium, Cpu } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { cn } from '@renderer/lib/utils'

interface Props {
  sl1: boolean
  sl2: boolean
  sl3: boolean
  sla: boolean   // auto mode active
  ldr: number    // LDR darkness percentage
  connected: boolean
  onSend: (cmd: string, desc: string) => void
}

interface LightRowProps {
  label: string
  isOn: boolean
  cmdOn: string
  cmdOff: string
  disabled: boolean
  onSend: (cmd: string, desc: string) => void
}

function LightRow({ label, isOn, cmdOn, cmdOff, disabled, onSend }: LightRowProps) {
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
        disabled={disabled}
        onCheckedChange={(on) =>
          onSend(on ? cmdOn : cmdOff, `${label} ${on ? 'ligada' : 'apagada'}`)
        }
      />
    </div>
  )
}

export function StreetlightPanel({ sl1, sl2, sl3, sla, ldr, connected, onSend }: Props) {
  const allOn  = sl1 && sl2 && sl3
  const allOff = !sl1 && !sl2 && !sl3
  const manualDisabled = !connected || sla

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iluminação Pública</CardTitle>
      </CardHeader>
      <CardContent>

        {/* Mode row */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            {sla
              ? <Cpu className="h-3.5 w-3.5 text-blue-400" />
              : <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
            }
            <Badge variant={sla ? 'default' : 'secondary'}>
              {sla ? 'Automático' : 'Manual'}
            </Badge>
            {sla && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <SunMedium className="h-3 w-3" />
                {ldr.toFixed(0)}% escuridão
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!connected}
            onClick={() =>
              sla
                ? onSend('LSM', 'Modo manual activado')
                : onSend('LSA', 'Modo automático (LDR) activado')
            }
          >
            {sla ? '→ Manual' : '→ Auto'}
          </Button>
        </div>

        {/* Individual lights — disabled in auto mode */}
        <div className="divide-y divide-border">
          <LightRow label="Luz de Rua 1" isOn={sl1} cmdOn="L1O" cmdOff="L1X" disabled={manualDisabled} onSend={onSend} />
          <LightRow label="Luz de Rua 2" isOn={sl2} cmdOn="L2O" cmdOff="L2X" disabled={manualDisabled} onSend={onSend} />
          <LightRow label="Luz de Rua 3" isOn={sl3} cmdOn="L3O" cmdOff="L3X" disabled={manualDisabled} onSend={onSend} />
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            className="flex-1"
            variant={allOn ? 'secondary' : 'warning'}
            size="sm"
            disabled={manualDisabled || allOn}
            onClick={() => onSend('LOO', 'Todas as luzes ligadas')}
          >
            <Lightbulb className="h-3.5 w-3.5" /> Ligar Todas
          </Button>
          <Button
            className="flex-1"
            variant={allOff ? 'secondary' : 'outline'}
            size="sm"
            disabled={manualDisabled || allOff}
            onClick={() => onSend('LXX', 'Todas as luzes apagadas')}
          >
            <LightbulbOff className="h-3.5 w-3.5" /> Apagar Todas
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
