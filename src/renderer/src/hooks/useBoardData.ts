import { useState, useEffect, useCallback } from 'react'
import type { BoardData, SerialStatus, LogEntry } from '../../../../../types/board'

const MAX_LOG = 150

export function useBoardData() {
  const [data, setData] = useState<BoardData | null>(null)
  const [status, setStatus] = useState<SerialStatus>({ connected: false })
  const [log, setLog] = useState<LogEntry[]>([])

  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLog((prev) => [
      { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ...prev.slice(0, MAX_LOG - 1)
    ])
  }, [])

  const connect = useCallback(async (port: string) => {
    addLog({ timestamp: new Date(), type: 'system', message: `A ligar em ${port}...` })
    const result = await window.electronAPI.serial.connect(port, 9600)
    if (!result.ok) {
      addLog({ timestamp: new Date(), type: 'error', message: `Falha ao ligar: ${result.error}` })
    }
  }, [addLog])

  const disconnect = useCallback(async () => {
    await window.electronAPI.serial.disconnect()
  }, [])

  const sendCommand = useCallback(async (cmd: string, desc: string) => {
    const ok = await window.electronAPI.serial.send(cmd)
    addLog({
      timestamp: new Date(),
      type: ok ? 'command' : 'error',
      message: ok ? `→ ${cmd}  —  ${desc}` : `Falha ao enviar "${cmd}" (não ligado)`
    })
  }, [addLog])

  useEffect(() => {
    const unData = window.electronAPI.serial.onData((d) => {
      setData({ ...d, timestamp: new Date(d.timestamp) })
      addLog({ timestamp: new Date(), type: 'data', message: 'Dados recebidos do controlador' })
    })

    const unStatus = window.electronAPI.serial.onStatus((s) => {
      setStatus(s)
      addLog({
        timestamp: new Date(),
        type: 'system',
        message: s.connected ? `Ligado em ${s.port}` : 'Conexão encerrada'
      })
    })

    const unError = window.electronAPI.serial.onError((msg) => {
      addLog({ timestamp: new Date(), type: 'error', message: `Erro serial: ${msg}` })
    })

    return () => { unData(); unStatus(); unError() }
  }, [addLog])

  return { data, status, log, connect, disconnect, sendCommand }
}
