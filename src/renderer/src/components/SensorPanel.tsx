import { Flame, CloudRain, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@renderer/lib/utils'

interface Props {
  fr: boolean
  rn: boolean
}

export function SensorPanel({ fr, rn }: Props) {

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
