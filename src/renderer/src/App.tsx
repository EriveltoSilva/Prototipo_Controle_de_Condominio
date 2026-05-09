import { Radio } from 'lucide-react'
import { useBoardData } from './hooks/useBoardData'
import { SerialBar } from './components/SerialBar'
import { TrafficLightPanel } from './components/TrafficLightPanel'
import { StreetlightPanel } from './components/StreetlightPanel'
import { GatePanel } from './components/GatePanel'
import { SensorPanel } from './components/SensorPanel'
import { ActivityLog } from './components/ActivityLog'
import { Button } from './components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function App() {
  const { data, status, log, connect, disconnect, sendCommand } = useBoardData()

  // Fallback values when no data received yet
  const tl1   = data?.tl1  ?? 'R'
  const tl2   = data?.tl2  ?? 'R'
  const tle   = data?.tle  ?? false
  const sl1   = data?.sl1  ?? false
  const sl2   = data?.sl2  ?? false
  const sl3   = data?.sl3  ?? false
  const sm    = data?.sm   ?? 0
  const fr    = data?.fr   ?? false
  const wl    = data?.wl   ?? 0
  const rn    = data?.rn   ?? false
  const gai   = data?.gai  ?? 'C'
  const gao   = data?.gao  ?? 'C'
  const gbi   = data?.gbi  ?? 'C'
  const gbo   = data?.gbo  ?? 'C'

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold tracking-wide">Centralidade do Kilamba</span>
          <span className="text-xs text-muted-foreground">— Painel de Controlo</span>
        </div>

        <div className="flex items-center gap-3">
          {status.connected && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => sendCommand('REQ', 'Dados solicitados manualmente')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          )}
          <SerialBar
            status={status}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 overflow-y-auto p-4">
        {!status.connected && (
          <div className="mb-4 rounded-lg border border-yellow-800/60 bg-yellow-900/20 px-4 py-2.5 text-sm text-yellow-300">
            Seleccione uma porta COM e clique em <strong>Ligar</strong> para iniciar a comunicação com o controlador.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <TrafficLightPanel
              tl1={tl1} tl2={tl2} enabled={tle}
              connected={status.connected}
              onSend={sendCommand}
            />
            <GatePanel
              gai={gai} gao={gao} gbi={gbi} gbo={gbo}
              connected={status.connected}
              onSend={sendCommand}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <StreetlightPanel
              sl1={sl1} sl2={sl2} sl3={sl3}
              connected={status.connected}
              onSend={sendCommand}
            />
            <SensorPanel sm={sm} fr={fr} wl={wl} rn={rn} />
          </div>
        </div>

        {/* Activity log — full width */}
        <div className="mt-4">
          <ActivityLog entries={log} />
        </div>
      </main>
    </div>
  )
}
