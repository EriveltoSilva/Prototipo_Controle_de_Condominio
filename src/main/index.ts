import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { SerialManager } from './serial'

let mainWindow: BrowserWindow | null = null
let serialManager: SerialManager | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'Gestao da Centralidade',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow!.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  serialManager = new SerialManager((event, data) => {
    mainWindow?.webContents.send(event, data)
  })

  ipcMain.handle('serial:list-ports', () => serialManager!.listPorts())

  ipcMain.handle('serial:connect', (_, port: string, baudRate: number) =>
    serialManager!.connect(port, baudRate)
  )

  ipcMain.handle('serial:disconnect', () => serialManager!.disconnect())

  ipcMain.handle('serial:send', (_, command: string) => serialManager!.send(command))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  serialManager?.disconnect()
  if (process.platform !== 'darwin') app.quit()
})
