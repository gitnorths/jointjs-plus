import * as path from 'path'
import * as fse from 'fs-extra'
import * as R from 'ramda'
import { MessageBox } from 'element-ui'
import { saveAs } from 'file-saver'
import notification from '@/renderer/common/notification'
import { getFirstPath, getWorkTagKey } from '@/renderer/common/util'
import store from '@/renderer/pages/symbolMaker/store'
import { openWindowDialog, openWindowLoading } from '@/renderer/common/action'
import { addRecentAction, clearRecentAction, closeConnection } from '@/renderer/pages/symbolMaker/action/appAction'
import { SymbolMakerService } from '@/service/SymbolMakerService'
import { ARCHIVE_FILE_EXT_NAME, ARCHIVE_FILE_NAME } from '@/util/consts'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'

const { version } = require('../../../../../package.json')

// 关闭符号包
export const closeSymbolArchive = async ({ data }) => {
  const closeDtos = store.getters.workTagsContainer.map(dto => dto.pathId.startsWith(data.pathId))

  function handleClose () {
    closeDtos.forEach(dto => {
      const index = R.findIndex(R.propEq(dto.pathId, 'pathId'))(store.getters.workTagsContainer)
      store.commit('closeTags', { curIndex: index, direction: '' })
    })
    store.commit('removeArchiveFromStore', data)
    // FIXME
    DataSourceManager.closeDataSource(data.name)
  }

  const seTagDeltaExist = closeDtos.filter((dto) => store.getters.seTagDeltaExist(getWorkTagKey(dto)))
  if (R.isEmpty(seTagDeltaExist)) {
    handleClose()
    return
  }

  try {
    await MessageBox.confirm('存在未保存的修改，是否保存？', '提示', {
      distinguishCancelAndClose: true,
      confirmButtonText: '保存',
      cancelButtonText: '不保存',
      type: 'warning'
    })
    // 先保存
    await store.dispatch('saveAll')
    handleClose()
  } catch (action) {
    if (action === 'cancel') {
      // 取消delta
      handleClose()
      return
    } else if (action === 'close') {
      return
    }
    notification.openErrorNotification(`保存失败 ${action}`).logger()
    throw action
  }
}

export const newSymbolArchiveAction = () => {
  store.commit('setArchiveDialogVisible', true)
}
export const openSymbolArchiveAction = async () => {
  const openDialogReturnValue = await openWindowDialog({
    title: '请选择符号仓',
    properties: ['openFile'],
    filters: [{ name: '符号仓', extensions: [ARCHIVE_FILE_NAME, 'llsym'] }]
  })
  const packagePath = getFirstPath(openDialogReturnValue.filePaths)
  if (R.isNil(packagePath)) {
    return
  }
  if (packagePath.endsWith('.llsym')) {
    // 导入符号
    store.commit('setllsymPath', packagePath)
    store.commit('setArchiveDialogVisible', true)
  } else {
    await openArchive(packagePath)
  }
}
// 打开工程
export const openRecentArchiveAction = async (packagePath) => {
  const exist = fse.pathExistsSync(packagePath)
  if (!exist) {
    try {
      await MessageBox.confirm('文件不存在，是否从历史记录中清除？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      })
      clearRecentAction(packagePath)
      return
    } catch (action) {
      return
    }
  }
  await openArchive(packagePath)
}

// 对话框打开windows文件夹选择框
export const setSaveDirectory = async () => {
  const openDialogReturnValue = await openWindowDialog({
    title: '选择本地仓储目录',
    properties: ['openDirectory'] // createDirectory
  })
  return getFirstPath(openDialogReturnValue.filePaths)
}

// 初始化资源管理器
const initTree = (symbolArchive) => {
  // 初始化目录
  store.commit('setSymbolCatalogViewIsVisible', true)
  store.commit('setSymbolOutputViewIsVisible', true)
  store.commit('addArchiveToStore', symbolArchive)
  store.commit('addNodeToWorkTagsContainer', symbolArchive)
}

// 解析符号仓
const openArchive = async (archiveDbPath) => {
  const archiveName = path.basename(archiveDbPath, ARCHIVE_FILE_EXT_NAME)
  const openedArchiveList = store.getters.archiveList
  const alreadyOpened = R.find(R.propEq(archiveName, 'name'))(openedArchiveList)
  if (alreadyOpened) {
    if (archiveDbPath === alreadyOpened.dbPath) {
      notification.openInfoNotification(`符号仓：${archiveName}已经打开。`).logger()
    } else {
      // FIXME 因为使用archiveName作为dataSource的key值
      notification.openWarningNotification(`不能同时打开多个同名符号仓：${archiveName}`).logger()
    }
    return
  }

  let loading
  try {
    /*
     // 先校验符号对应的符号编辑器版本，提示升级
     const checkResult = ReleaseService.checkVersion(archiveDbPath)
     if (checkResult && checkResult.needUpdate) {
       if (!checkResult.automatic) {
         return MessageBox.alert(checkResult.msg)
       }
       const operation = await VXETable.modal.confirm({
         title: '需要升级',
         status: 'warning',
         message: checkResult.msg,
         destroyOnClose: true
       })
       if (operation !== 'confirm') {
         return
       }

       try {
         loading = openWindowLoading('升级符号中...')
         ReleaseService.upgradePackage(archiveDbPath)
       } catch (e) {
         notification.openErrorNotification(`符号仓 ${archiveName} 升级失败！${e}`).logger()
         return
       }
     }
     */
    loading = openWindowLoading('打开符号仓中...')
    const symbolArchive = await SymbolMakerService.openSymbolArchive(archiveDbPath)
    notification.openSuccessNotification(`打开符号仓 ${archiveName} 成功`).logger()
    // 更新打开历史记录
    addRecentAction(archiveDbPath)
    // 更新树
    initTree(symbolArchive)
  } catch (error) {
    notification.openErrorNotification(`打开符号仓 ${archiveName} 失败， ${error}`).logger()
  } finally {
    if (loading) {
      loading.close()
    }
  }
}

function formatRootDir (directory) {
  // 如果传的是盘符，取消最后的\
  return directory.endsWith(':\\') ? directory.substring(0, directory.length - 1) : directory
}

// 新建符号仓
export const createNewArchive = async (newPackage) => {
  const requestData = {
    toolVersion: version,
    name: newPackage.name,
    organization: newPackage.organization,
    saveDir: formatRootDir(newPackage.directory)
  }

  const loading = openWindowLoading('新建符号仓中...')
  try {
    const packagePath = await SymbolMakerService.createSymbolArchive(requestData)
    notification.openSuccessNotification(`新建符号仓 ${requestData.name} 成功`).logger()
    // 更新打开记录
    await openArchive(packagePath)
  } catch (err) {
    notification.openErrorNotification(`新建符号仓 ${newPackage.name} 失败，${err}`).logger()
  } finally {
    loading.close()
  }
}

// 导入符号仓
export const importLLSYM = async (newPackage) => {
  const requestData = {
    toolVersion: version,
    name: newPackage.name,
    organization: newPackage.organization,
    llsymPath: newPackage.llsymPath,
    saveDir: formatRootDir(newPackage.directory)
  }

  const loading = openWindowLoading('导入符号仓中...')
  setTimeout(async () => {
    try {
      const packagePath = await SymbolMakerService.importSymbolArchive(requestData)
      notification.openSuccessNotification(`导入符号仓 ${requestData.name} 成功`).logger()
      // 更新打开历史记录
      await openArchive(packagePath)
    } catch (err) {
      notification.openErrorNotification(`导入符号仓失败 ${err}`).logger()
    } finally {
      loading.close()
    }
  }, 100)
}

export const updateSymbolArchive = (archive) => {
  if (archive.name !== archive.orgName) {
    // FIXME
    clearRecentAction(archive.dbPath)
    addRecentAction(archive.dbPath)
  }

  return SymbolMakerService.updateSymbolArchive()
}

const clearState = async () => {
  await closeConnection()

  store.commit('clearArchiveStore')
  store.commit('clearWorkTagStore')
}

export const closeAllPkg = async () => {
  const deltaExist = store.getters.seTagDeltaExist()
  if (!deltaExist) {
    await clearState()
    return
  }

  try {
    await MessageBox.confirm('存在未保存的修改，是否保存？', '提示', {
      confirmButtonText: '保存',
      cancelButtonText: '不保存',
      type: 'warning'
    })
    // 先保存
    await store.dispatch('saveAll')
    await clearState()
  } catch (action) {
    if (action === 'cancel') {
      await clearState()
      return
    } else if (action === 'close') {
      return
    }
    notification.openErrorNotification(`保存失败 ${action}`).logger()
    throw action
  }
}

export const exportPkg = async ({ data }) => {
  const deltaKeys = Object.keys(store.getters.seDelta) || []
  const seTagDeltaExist = R.filter((key) => R.includes(data.pathId, key) && store.getters.seTagDeltaExist(key))(deltaKeys)
  if (!seTagDeltaExist || seTagDeltaExist.length === 0) {
    saveAs(data, `${data.name}.pkg`)
    return
  }

  try {
    await MessageBox.confirm('存在未保存的修改，需要先保存，是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true
    })
    // 先保存
    await store.dispatch('saveAll')
    saveAs(data, `${data.name}.pkg`)
  } catch (action) {
    if (action === 'cancel') {
      notification.openInfoNotification('取消打包')
      return
    }
    notification.openErrorNotification(`保存失败 ${action}`).logger()
    throw action
  }
}
