import { contextBridge, ipcRenderer } from 'electron'
import type { BoardData, SerialStatus } from '../types/board'

contextBridge.exposeInMainWorld('electronAPI', {
  serial: {
    listPorts: (): Promise<string[]> =>
      ipcRenderer.invoke('serial:list-ports'),

    connect: (port: string, baudRate: number): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke('serial:connect', port, baudRate),

    disconnect: (): Promise<void> =>
      ipcRenderer.invoke('serial:disconnect'),

    send: (command: string): Promise<boolean> =>
      ipcRenderer.invoke('serial:send', command),

    onData: (cb: (data: BoardData) => void): (() => void) => {
      const fn = (_: Electron.IpcRendererEvent, d: BoardData) => cb(d)
      ipcRenderer.on('serial:data', fn)
      return () => ipcRenderer.removeListener('serial:data', fn)
    },

    onStatus: (cb: (s: SerialStatus) => void): (() => void) => {
      const fn = (_: Electron.IpcRendererEvent, s: SerialStatus) => cb(s)
      ipcRenderer.on('serial:status', fn)
      return () => ipcRenderer.removeListener('serial:status', fn)
    },

    onError: (cb: (msg: string) => void): (() => void) => {
      const fn = (_: Electron.IpcRendererEvent, msg: string) => cb(msg)
      ipcRenderer.on('serial:error', fn)
      return () => ipcRenderer.removeListener('serial:error', fn)
    }
  }
})
