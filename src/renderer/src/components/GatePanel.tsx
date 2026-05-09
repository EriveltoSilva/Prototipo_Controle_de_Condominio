import { DoorOpen, DoorClosed } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import type { GateState } from '../../../../../types/board'

interface GateRowProps {
  label: string
  state: GateState
  cmdOpen: string
  cmdClose: string
  connected: boolean
  onSend: (cmd: string, desc: string) => void
}

function GateRow({ label, state, cmdOpen, cmdClose, connected, onSend }: GateRowProps) {
  const isOpen = state === 'O'
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        {isOpen
          ? <DoorOpen className="h-4 w-4 shrink-0 text-green-400" />
          : <DoorClosed className="h-4 w-4 shrink-0 text-muted-foreground" />
        }
        <span className="text-sm truncate">{label}</span>
        <Badge variant={isOpen ? 'success' : 'secondary'}>
          {isOpen ? 'Aberto' : 'Fechado'}
        </Badge>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          size="sm"
          variant="success"
          disabled={!connected || isOpen}
          onClick={() => onSend(cmdOpen, `${label} aberta`)}
        >
          Abrir
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!connected || !isOpen}
          onClick={() => onSend(cmdClose, `${label} fechada`)}
        >
          Fechar
        </Button>
      </div>
    </div>
  )
}

interface Props {
  gai: GateState
  gao: GateState
  gbi: GateState
  gbo: GateState
  connected: boolean
  onSend: (cmd: string, desc: string) => void
}

export function GatePanel({ gai, gao, gbi, gbo, connected, onSend }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portões</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Lado A</p>
        <div className="mb-3 divide-y divide-border">
          <GateRow label="Entrada" state={gai} cmdOpen="AIO" cmdClose="AIC" connected={connected} onSend={onSend} />
          <GateRow label="Saída"   state={gao} cmdOpen="AOO" cmdClose="AOC" connected={connected} onSend={onSend} />
        </div>

        <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Lado B</p>
        <div className="divide-y divide-border">
          <GateRow label="Entrada" state={gbi} cmdOpen="BIO" cmdClose="BIC" connected={connected} onSend={onSend} />
          <GateRow label="Saída"   state={gbo} cmdOpen="BOO" cmdClose="BOC" connected={connected} onSend={onSend} />
        </div>
      </CardContent>
    </Card>
  )
}
