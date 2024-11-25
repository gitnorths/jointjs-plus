import { ipcMain } from 'electron'
import { SymbolMakerWindow } from '@/main/SymbolMakerWindow'
import { NextStudioWindow } from '@/main/NextStudioWindow'

// 定义窗口字符串常量
const NEXT_STUDIO = 'win'
const SYMBOL_MAKER = 'sm'
/**
 * Keep a global reference of the window object, if you don't, the window will
 * be closed automatically when the JavaScript object is garbage collected.
 */
const allBrowserWindowsMap = new Map()

export function initMainWindow () {
  windowFactory(NEXT_STUDIO)
}

function windowFactory (key: string) {
  closeWindowHandler(key)
  switch (key) {
    case NEXT_STUDIO:
      allBrowserWindowsMap.set(key, new NextStudioWindow())
      break
    case SYMBOL_MAKER:
      allBrowserWindowsMap.set(key, new SymbolMakerWindow())
  }
}

function openWindowHandler (key: string) {
  const exist = allBrowserWindowsMap.get(key)
  if (exist) {
    exist.show()
  } else {
    windowFactory(key)
  }
}

function closeWindowHandler (key: string) {
  const exist = allBrowserWindowsMap.get(key)
  if (exist) {
    // Force closing the window, the unload and beforeunload event won't be emitted for the web page,
    // and close event will also not be emitted for this window,
    // but it guarantees the closed event will be emitted.
    exist.destroy()
    allBrowserWindowsMap.delete(key)
  }
}

/**
 * NextStudio
 */
ipcMain.on('open-studio-window', () => {
  openWindowHandler(NEXT_STUDIO)
})
ipcMain.on('close-studio-window', () => {
  closeWindowHandler(NEXT_STUDIO)
})
/**
 * 符号编辑器
 */
ipcMain.on('open-sm-window', () => {
  openWindowHandler(SYMBOL_MAKER)
})
ipcMain.on('close-sm-window', () => {
  closeWindowHandler(SYMBOL_MAKER)
})
