import { cn } from "@renderer/lib/utils";
import { AlertTriangle, Bell, BellRing, CloudRain, Flame, ShieldCheck } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  fr: boolean;
  rn: boolean;
  bzr: boolean;
}

export function SensorPanel({ fr, rn, bzr }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sensores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Fire */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={cn("h-4 w-4", fr ? "text-red-500 animate-pulse" : "text-muted-foreground")} />
            <span className="text-sm">Fogo</span>
          </div>
          {fr ? (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" />
              DETECTADO
            </Badge>
          ) : (
            <Badge variant="success">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Seguro
            </Badge>
          )}
        </div>

        {/* Rain */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className={cn("h-4 w-4", rn ? "text-blue-400" : "text-muted-foreground")} />
            <span className="text-sm">Chuva</span>
          </div>
          {rn ? <Badge variant="default">A chover</Badge> : <Badge variant="secondary">Sem chuva</Badge>}
        </div>

        {/* Buzzer alarm — shown below fire, always visible */}
        <div
          className={cn(
            "flex items-center justify-between rounded-md py-1 transition-colors",
            bzr ? "bg-red-950/40 border border-red-800/60" : "",
          )}
        >
          <div className="flex items-center gap-2">
            {bzr ? (
              <BellRing className="h-4 w-4 text-red-400 animate-pulse" />
            ) : (
              <Bell className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Alarme Sonoro</span>
          </div>
          {bzr ? <Badge variant="destructive">ACTIVO</Badge> : <Badge variant="secondary">Silencioso</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
