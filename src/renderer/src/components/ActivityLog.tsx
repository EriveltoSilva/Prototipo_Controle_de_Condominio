import { cn, formatTime } from "@renderer/lib/utils";
import { AlertCircle, ArrowDown, ArrowUp, Info, ScrollText } from "lucide-react";
import type { LogEntry } from "../../../../../types/board";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  entries: LogEntry[];
}

const icons = {
  data: <ArrowDown className="h-3 w-3 text-blue-400 shrink-0" />,
  command: <ArrowUp className="h-3 w-3 text-green-400 shrink-0" />,
  system: <Info className="h-3 w-3 text-muted-foreground shrink-0" />,
  error: <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />,
};

const textColors = {
  data: "text-blue-300",
  command: "text-green-300",
  system: "text-muted-foreground",
  error: "text-red-400",
};

export function ActivityLog({ entries }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-1.5">
          <ScrollText className="h-3.5 w-3.5" />
          Log de Actividade
        </CardTitle>
        <span className="text-xs text-muted-foreground">{entries.length} entradas</span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-60 overflow-y-auto px-4 pb-3">
          {entries.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma actividade ainda</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="w-full flex items-start gap-2 py-0.5">
              <span className="mt-0.5 shrink-0 font-mono text-[10px] text-muted-foreground/60">
                {formatTime(e.timestamp)}
              </span>
              {icons[e.type]}
              <span className={cn("text-xs", textColors[e.type])}>{e.message}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
