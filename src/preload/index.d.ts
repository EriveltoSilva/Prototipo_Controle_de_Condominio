import type { BoardData, SerialStatus } from '../types/board'

declare global {
  interface Window {
    electronAPI: {
      serial: {
        listPorts: () => Promise<string[]>
        connect: (port: string, baudRate: number) => Promise<{ ok: boolean; error?: string }>
        disconnect: () => Promise<void>
        send: (command: string) => Promise<boolean>
        onData: (cb: (data: BoardData) => void) => () => void
        onStatus: (cb: (status: SerialStatus) => void) => () => void
        onError: (cb: (message: string) => void) => () => void
      }
    }
  }
}
