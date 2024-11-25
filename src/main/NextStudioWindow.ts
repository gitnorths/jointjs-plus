'use strict'
/* global __static */

import { BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import path from 'path'

const isDevelopment = process.env.NODE_ENV !== 'production'

export class NextStudioWindow extends BrowserWindow {
  constructor () {
    super({
      // @ts-ignore
      icon: path.join(__static, 'logo/nextStudio.png'),
      width: 1600,
      height: 900,
      show: false,
      webPreferences: {
        // In electron < 14.0.0, @electron/remote respects the enableRemoteModule WebPreferences value.
        // You must pass { webPreferences: { enableRemoteModule: true } } to the constructor of BrowserWindows
        // that should be granted permission to use @electron/remote.
        // enableRemoteModule: true,
        webSecurity: false,
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
        backgroundThrottling: false // 取消后台睡眠机制，避免变量调试等周期性事件断连
      }
    })
    // In electron >= 14.0.0, you must use the new enable API to enable the remote module for each desired WebContents separately:
    require('@electron/remote/main').enable(this.webContents)

    this.setMenu(null)

    if (isDevelopment) {
      this.webContents.openDevTools()
    }

    this.once('ready-to-show', () => {
      this.show()
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      this.loadURL(process.env.WEBPACK_DEV_SERVER_URL + 'nextStudio')
      this.webContents.openDevTools()
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      this.loadURL('app://./nextStudio.html')
    }

    this.on('close', (e) => {
      this.webContents.send('studio-window-close')
      e.preventDefault()
    })

    this.on('closed', () => {
      // TODO
    })

    // FIXME 控制台调出快捷键
    this.webContents.on('before-input-event', (event, input) => {
      if (input.key.toLowerCase() === 'f12') {
        this.webContents.openDevTools()
        event.preventDefault()
      }
    })
  }
}
