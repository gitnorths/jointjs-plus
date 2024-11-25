import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { newWorker } from '@/main/util'
import { Worker } from 'worker_threads'
import OpenDialogOptions = Electron.Renderer.OpenDialogOptions
import SaveDialogOptions = Electron.Renderer.SaveDialogOptions

// 线程管理
export const workerMap = new Map<string, Worker>()
// 打开文件窗口
ipcMain.handle('dialog:openFile', (ev, options: OpenDialogOptions) => {
  return dialog.showOpenDialog(<Electron.BrowserWindow>BrowserWindow.fromWebContents(ev.sender), options)
})

// 打开文件保存窗口
ipcMain.handle('dialog:openSave', (ev, options: SaveDialogOptions) => {
  return dialog.showSaveDialog(<Electron.BrowserWindow>BrowserWindow.fromWebContents(ev.sender), options)
})

// 在文件夹中显示
ipcMain.on('shell:showInFolder', (ev, dir) => {
  if (dir) {
    shell.showItemInFolder(dir)
  }
})

// 访问外部链接
ipcMain.on('shell:openExternal', (ev, url) => {
  shell.openExternal(url)
})

// 线程
ipcMain.handle('worker:generateVarTree', (ev, dbPath) => {
  return new Promise((resolve, reject) => {
    const key = 'VarTreeWorker'
    let varTreeWorker = workerMap.get(key)
    if (!varTreeWorker) {
      varTreeWorker = newWorker(key)
      workerMap.set(key, varTreeWorker)
      console.log('new thread' + varTreeWorker.threadId)
    } else {
      console.log('exist thread' + varTreeWorker.threadId)
    }
    // 监听 Worker 线程返回的消息
    varTreeWorker.on('message', (result: any) => {
      resolve(result) // 将结果返回给 ipcRenderer
    })

    // 监听 Worker 线程的错误
    varTreeWorker.on('error', (error: any) => {
      varTreeWorker?.terminate().finally(() => {
        workerMap.delete(key)
      })
      reject(error) // 返回错误
    })

    // 监听 Worker 线程的退出
    varTreeWorker.on('exit', (code: any) => {
      console.log(`VarTreeWorker退出： ${code}`)
      workerMap.delete(key)
    })

    varTreeWorker.postMessage({ dbPath })
  })
})

// 线程
ipcMain.handle('worker:getProtoArchive', (ev, dbPath) => {
  return new Promise((resolve, reject) => {
    const key = 'SymbolProtoWorker'
    let symbolProtoWorker = workerMap.get(key)
    if (!symbolProtoWorker) {
      symbolProtoWorker = newWorker(key)
      workerMap.set(key, symbolProtoWorker)
      console.log('new thread' + symbolProtoWorker.threadId)
    } else {
      console.log('exist thread' + symbolProtoWorker.threadId)
    }

    // 监听 Worker 线程返回的消息
    symbolProtoWorker.on('message', (result: any) => {
      resolve(result) // 将结果返回给 ipcRenderer
    })

    // 监听 Worker 线程的错误
    symbolProtoWorker.on('error', (error: any) => {
      symbolProtoWorker?.terminate().finally(() => {
        workerMap.delete(key)
      })
      reject(error) // 返回错误
    })

    // 监听 Worker 线程的退出
    symbolProtoWorker.on('exit', (code: any) => {
      console.log(`SymbolProtoWorker： ${code}`)
      workerMap.delete(key)
    })

    symbolProtoWorker.postMessage({ dbPath })
  })
})
