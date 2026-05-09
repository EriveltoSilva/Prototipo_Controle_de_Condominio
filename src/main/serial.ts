import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import type { BoardData, TLColor, GateState } from '../types/board'

type EmitFn = (event: string, data: unknown) => void

export class SerialManager {
  private port: SerialPort | null = null
  private emit: EmitFn

  constructor(emit: EmitFn) {
    this.emit = emit
  }

  async listPorts(): Promise<string[]> {
    try {
      const ports = await SerialPort.list()
      return ports.map((p) => p.path)
    } catch {
      return []
    }
  }

  connect(path: string, baudRate: number): Promise<{ ok: boolean; error?: string }> {
    if (this.port?.isOpen) this.disconnect()

    return new Promise((resolve) => {
      this.port = new SerialPort({ path, baudRate }, (err) => {
        if (err) {
          this.emit('serial:status', { connected: false })
          this.emit('serial:error', err.message)
          resolve({ ok: false, error: err.message })
          return
        }

        const parser = this.port!.pipe(new ReadlineParser({ delimiter: '\n' }))

        parser.on('data', (raw: string) => {
          const data = this.parsePacket(raw)
          if (data) this.emit('serial:data', data)
        })

        this.port!.on('close', () => this.emit('serial:status', { connected: false }))
        this.port!.on('error', (e) => this.emit('serial:error', e.message))

        this.emit('serial:status', { connected: true, port: path })
        resolve({ ok: true })
      })
    })
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.port?.isOpen) { resolve(); return }
      this.port.close(() => { this.port = null; resolve() })
    })
  }

  send(command: string): boolean {
    if (!this.port?.isOpen) return false
    this.port.write(command + '\n')
    return true
  }

  private parsePacket(raw: string): BoardData | null {
    const start = raw.indexOf('$')
    const end = raw.indexOf('#')
    if (start === -1 || end === -1 || end <= start) return null

    const fields: Record<string, string> = {}
    for (const field of raw.slice(start + 1, end).split(',')) {
      const colon = field.indexOf(':')
      if (colon === -1) continue
      fields[field.slice(0, colon).trim()] = field.slice(colon + 1).trim()
    }

    if (!fields.TL1 || !fields.TL2) return null

    return {
      tl1: (fields.TL1 as TLColor) ?? 'R',
      tl2: (fields.TL2 as TLColor) ?? 'R',
      sl1: fields.SL1 === '1',
      sl2: fields.SL2 === '1',
      sl3: fields.SL3 === '1',
      fr: fields.FR === '1',
      wl: parseFloat(fields.WL ?? '0'),
      rn: fields.RN === '1',
      gai: (fields.GAI as GateState) ?? 'C',
      gao: (fields.GAO as GateState) ?? 'C',
      gbi: (fields.GBI as GateState) ?? 'C',
      gbo: (fields.GBO as GateState) ?? 'C',
      tle: fields.TLE === '1',
      timestamp: new Date()
    }
  }
}
