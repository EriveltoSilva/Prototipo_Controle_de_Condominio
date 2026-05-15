import { RefreshCw } from "lucide-react";
import logo from "./assets/logo.png";
import { ActivityLog } from "./components/ActivityLog";
import { GatePanel } from "./components/GatePanel";
import { ReservoirPanel } from "./components/ReservoirPanel";
import { SensorPanel } from "./components/SensorPanel";
import { SerialBar } from "./components/SerialBar";
import { StreetlightPanel } from "./components/StreetlightPanel";
import { TrafficLightPanel } from "./components/TrafficLightPanel";
import { Button } from "./components/ui/button";
import { useBoardData } from "./hooks/useBoardData";

export default function App() {
  const { data, status, log, connect, disconnect, sendCommand } = useBoardData();

  // Fallback values when no data received yet
  const tl1 = data?.tl1 ?? "R";
  const tl2 = data?.tl2 ?? "R";
  const tle = data?.tle ?? false;
  const sl1 = data?.sl1 ?? false;
  const sl2 = data?.sl2 ?? false;
  const sl3 = data?.sl3 ?? false;
  const fr  = data?.fr  ?? false;
  const wl  = data?.wl  ?? 0;
  const rn  = data?.rn  ?? false;
  const ldr = data?.ldr ?? 0;
  const sla = data?.sla ?? true;
  const bzr = data?.bzr ?? false;
  const gai = data?.gai ?? "C";
  const gao = data?.gao ?? "C";
  const gbi = data?.gbi ?? "C";
  const gbo = data?.gbo ?? "C";

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-7 w-7 object-contain" />
          <span className="text-sm font-semibold tracking-wide">Gestao da Centralidade</span>
          <span className="text-xs text-muted-foreground">— Painel de Controlo</span>
        </div>

        <div className="flex items-center gap-3">
          {status.connected && (
            <Button size="sm" variant="ghost" onClick={() => sendCommand("REQ", "Dados solicitados manualmente")}>
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          )}
          <SerialBar status={status} onConnect={connect} onDisconnect={disconnect} />
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 overflow-y-auto p-4">
        {!status.connected && (
          <div className="mb-4 rounded-lg border border-yellow-800/60 bg-yellow-900/20 px-4 py-2.5 text-sm text-yellow-300">
            Seleccione uma porta COM e clique em <strong>Ligar</strong> para iniciar a comunicação com o controlador.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
          {/* Left column */}
          <TrafficLightPanel tl1={tl1} tl2={tl2} enabled={tle} connected={status.connected} onSend={sendCommand} />
          <GatePanel gai={gai} gao={gao} gbi={gbi} gbo={gbo} connected={status.connected} onSend={sendCommand} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
          <StreetlightPanel sl1={sl1} sl2={sl2} sl3={sl3} sla={sla} ldr={ldr} connected={status.connected} onSend={sendCommand} />
          <SensorPanel fr={fr} rn={rn} bzr={bzr} />
        </div>

        {/* Reservoir — full width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
          <ReservoirPanel wl={wl} />
          <ActivityLog entries={log} />
        </div>
      </main>
    </div>
  );
}
