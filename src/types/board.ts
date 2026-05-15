export type TLColor = 'R' | 'Y' | 'G'
export type GateState = 'O' | 'C'

export interface BoardData {
  tl1: TLColor
  tl2: TLColor
  sl1: boolean
  sl2: boolean
  sl3: boolean
  fr: boolean
  wl: number
  rn: boolean
  gai: GateState
  gao: GateState
  gbi: GateState
  gbo: GateState
  tle: boolean
  ldr: number   // LDR darkness percentage (0–100)
  sla: boolean  // streetlight auto mode active
  bzr: boolean  // buzzer alarm active
  timestamp: Date
}

export interface SerialStatus {
  connected: boolean
  port?: string
}

export interface LogEntry {
  id: string
  timestamp: Date
  type: 'data' | 'command' | 'system' | 'error'
  message: string
}
