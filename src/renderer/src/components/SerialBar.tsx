import { useEffect, useState } from 'react'
import { Plug, PlugZap, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@renderer/lib/utils'
import type { SerialStatus } from '../../../../../types/board'

interface Props {
  status: SerialStatus
  onConnect: (port: string) => void
  onDisconnect: () => void
}

export function SerialBar({ status, onConnect, onDisconnect }: Props) {
  const [ports, setPorts] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    const list = await window.electronAPI.serial.listPorts()
    setPorts(list)
    if (list.length > 0 && !list.includes(selected)) setSelected(list[0])
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleToggle() {
    if (status.connected) {
      await onDisconnect()
    } else if (selected) {
      await onConnect(selected)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'h-2 w-2 rounded-full transition-colors',
          status.connected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]' : 'bg-gray-600'
        )}
      />
      <span className="text-xs text-muted-foreground">
        {status.connected ? `Ligado em ${status.port}` : 'Desligado'}
      </span>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={status.connected}
        className="h-8 rounded-md border border-border bg-secondary px-2 text-xs text-foreground disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {ports.length === 0 && <option value="">Sem portas</option>}
        {ports.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <Button size="icon" variant="ghost" onClick={refresh} disabled={loading || status.connected}>
        <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
      </Button>

      <Button
        size="sm"
        variant={status.connected ? 'destructive' : 'default'}
        onClick={handleToggle}
        disabled={!status.connected && !selected}
      >
        {status.connected
          ? <><Plug className="h-3.5 w-3.5" /> Desligar</>
          : <><PlugZap className="h-3.5 w-3.5" /> Ligar</>
        }
      </Button>
    </div>
  )
}
