import { MessageBox } from 'element-ui'
import * as R from 'ramda'
import * as path from 'path'
import logger from '@/renderer/common/logger'
import store from '@/renderer/pages/nextStudio/store'
import VBus from '@/renderer/common/vbus'
import { DEVICE_FILE_EXT_NAME, IED_TOOL_NAME, RECENT_DEVICE_RECORD } from '@/util/consts'
import { ipcRenderer } from 'electron'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'

export const changeWindowCatalogViewVisibleStatus = () => {
  const status = store.getters.windowCatalogViewVisible

  store.commit('setWindowCatalogViewIsVisible', !status)
  logger.info(`[${IED_TOOL_NAME}] ${!status ? '打开' : '关闭'}资源管理器窗口 ${status} => ${!status}`)
}

export const changeWindowVariableViewVisibleStatus = () => {
  const status = store.getters.windowVariableViewVisible

  store.commit('setWindowVariableViewIsVisible', !status)
  logger.info(`[${IED_TOOL_NAME}] ${!status ? '打开' : '关闭'}变量库窗口 ${status} => ${!status}`)
}

export const changeWindowOutputViewVisibleStatus = () => {
  const status = store.getters.windowOutputViewVisible

  store.commit('setWindowOutputViewIsVisible', !status)
  logger.info(`[${IED_TOOL_NAME}] ${!status ? '打开' : '关闭'}输出变量窗口 ${status} => ${!status}`)
}

export const getRecentAction = () => {
  const recent = localStorage.getItem(RECENT_DEVICE_RECORD)
  return recent ? JSON.parse(recent) : []
}
// 添加文件打开历史记录
export const addRecentAction = (filePath) => {
  let recent = getRecentAction()
  for (let i = 0; i < recent.length; i++) {
    if (recent[i] === filePath) {
      recent.splice(i, 1)
    }
  }
  recent.unshift(filePath)
  recent = recent.slice(0, 10)
  localStorage.setItem(RECENT_DEVICE_RECORD, JSON.stringify(recent))
  VBus.$emit('REFRESH_MENU_BAR')
}

export const clearRecentAction = (dirtyPath) => {
  // 清除单条记录
  if (dirtyPath) {
    const recent = getRecentAction()
    recent.splice(R.indexOf(dirtyPath, recent), 1)
    localStorage.setItem(RECENT_DEVICE_RECORD, JSON.stringify(recent))
  } else {
    // 清除所有记录 FIXME deviceDbPath
    const deviceDbPath = store.getters.deviceDbPath
    if (deviceDbPath) {
      localStorage.setItem(RECENT_DEVICE_RECORD, JSON.stringify([path.basename(deviceDbPath, DEVICE_FILE_EXT_NAME)]))
    } else {
      localStorage.setItem(RECENT_DEVICE_RECORD, '')
    }
  }

  VBus.$emit('REFRESH_MENU_BAR')
}

export const closeConnection = async () => {
  try {
    // FIXME
    const deviceDbName = store.getters.deviceDbName
    if (deviceDbName) {
      await DataSourceManager.closeDataSource(deviceDbName)
      logger.info(`[Connection] 数据库连接 ${store.getters.deviceDbPath} 关闭`)
    }
  } catch (e) {
    logger.error('[Connection]' + e)
  }
}

const closeWindow = async () => {
  await closeConnection()
  logger.info(`[${IED_TOOL_NAME}] 程序关闭`)
  ipcRenderer.send('close-studio-window')
}

export const closeNextStudioAction = async () => {
  const existDelta = store.getters.tagDeltaExist()
  if (existDelta) {
    try {
      await MessageBox.confirm('存在未保存的修改记录，是否保存？', '提示', {
        distinguishCancelAndClose: true,
        confirmButtonText: '保存',
        cancelButtonText: '不保存',
        type: 'warning',
        center: true
      })
      await store.dispatch('saveAll', true)
      await closeWindow()
    } catch (action) {
      if (action === 'cancel') {
        await closeWindow()
      }
    }
  } else {
    await closeWindow()
  }
}

export const showVersionInfoAction = () => {
  const { version } = require('../../../../../package.json')

  MessageBox.alert(`软件当前的版本号为：${version}`, '版本号')
}

export const showPreferenceDialog = (key) => {
  VBus.$emit('OPEN_PREFERENCE_DIALOG', key)
}

export const openSymbolMaker = () => {
  ipcRenderer.send('open-sm-window')
}
export const openProjectDir = () => {
  ipcRenderer.send('shell:showInFolder', store.getters.deviceDbPath)
}

export const openLineChart = () => {
  ipcRenderer.send('open-line-chart-window')
}

export const openRealtimeChart = () => {
  ipcRenderer.send('open-realtime-chart-window')
}
