import * as path from 'path'
import * as R from 'ramda'
import { ipcRenderer } from 'electron'
import { MessageBox } from 'element-ui'
import store from '@/renderer/pages/symbolMaker/store'
import logger from '@/renderer/common/logger'
import VBus from '@/renderer/common/vbus'
import notification from '@/renderer/common/notification'
import { ARCHIVE_FILE_EXT_NAME, RECENT_ARCHIVE_RECORD, SYMBOL_MAKER_NAME } from '@/util/consts'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'

/**
 * 窗口显示管理
 */
// 菜单-视图-资源管理器窗口
export const changeSymbolCatalogViewVisibleStatus = () => {
  const status = store.getters.symbolCatalogViewVisible

  store.commit('setSymbolCatalogViewIsVisible', !status)
  logger.info(`[${SYMBOL_MAKER_NAME}] ${!status ? '打开' : '关闭'}符号编辑器资源管理器窗口 ${status} => ${!status}`)
}
// 菜单-视图-输出变量窗口
export const changeSymbolOutputViewVisibleStatus = () => {
  const status = store.getters.symbolOutputViewVisible

  store.commit('setSymbolOutputViewIsVisible', !status)
  logger.info(`[${SYMBOL_MAKER_NAME}] ${!status ? '打开' : '关闭'}符号编辑器日志窗口 ${status} => ${!status}`)
}

/**
 * 最近工程管理
 */
export const getRecentAction = () => {
  const record = localStorage.getItem(RECENT_ARCHIVE_RECORD)
  return record ? JSON.parse(record) : []
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
  localStorage.setItem(RECENT_ARCHIVE_RECORD, JSON.stringify(recent))
  VBus.$emit('REFRESH_MENU_BAR')
}

export const clearRecentAction = (dirtyPath) => {
  // 清除单条记录
  if (dirtyPath) {
    const recent = getRecentAction()
    recent.splice(R.indexOf(dirtyPath, recent), 1)
    localStorage.setItem(RECENT_ARCHIVE_RECORD, JSON.stringify(recent))
  } else {
    // FIXME
    const archivePath = store.getters.archiveList
    if (R.isNotEmpty(archivePath)) {
      const recent = archivePath.map((str) => path.basename(str, ARCHIVE_FILE_EXT_NAME))
      localStorage.setItem(RECENT_ARCHIVE_RECORD, JSON.stringify([...recent]))
    } else {
      localStorage.setItem(RECENT_ARCHIVE_RECORD, '')
    }
  }
  VBus.$emit('REFRESH_MENU_BAR')
}

export const closeConnection = async () => {
  try {
    const archiveList = store.getters.archiveList
    if (R.isNotEmpty(archiveList)) {
      for (const archivePath of archiveList) {
        await DataSourceManager.closeDataSource(path.basename(archivePath, ARCHIVE_FILE_EXT_NAME))
      }
      logger.info('[Connection] 数据库连接关闭')
    }
  } catch (e) {
    logger.error('[Connection]' + e)
  }
}

const closeWindow = async () => {
  await closeConnection()
  logger.info(`[${SYMBOL_MAKER_NAME}] 功能块编辑器关闭`)
  ipcRenderer.send('close-sm-window')
}

export const closeSymbolMakerAction = async () => {
  const deltaExist = store.getters.seTagDeltaExist()
  if (deltaExist) {
    try {
      await MessageBox.confirm('SymbolMaker有未保存的修改，是否保存？', '提示', {
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

export const openNextStudioAction = () => {
  ipcRenderer.send('open-studio-window')
}

// 保存
export const saveAllAction = async () => {
  try {
    await store.dispatch('saveAll')
  } catch (e) {
    let msg = ''
    if (typeof e === 'string') {
      msg = `保存失败, ${e}`
    } else if (e instanceof Error) {
      msg = `保存失败, ${e.message}`
    }
    notification.openErrorNotification(`[${SYMBOL_MAKER_NAME}] ${msg}`).logger()
  }
}

export const showVersionInfoAction = () => {
  const { version } = require('../../../../../package.json')

  MessageBox.alert(`软件当前的版本号为：${version}`, '版本号')
}
