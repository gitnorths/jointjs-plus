import * as fse from 'fs-extra'
import * as R from 'ramda'
import VBus from '@/renderer/common/vbus'
import store from '@/renderer/pages/nextStudio/store'
import { MessageBox } from 'element-ui'
import { mxStencilRegistry } from '@/renderer/common/mxgraph'
import { DEVICE_FILE_NAME } from '@/util/consts'
import { getFirstPath, noNilAndEmptyRule } from '@/renderer/common/util'
import notification from '@/renderer/common/notification'
import { NextStudioService } from '@/service/NextStudioService'
import { openWindowDialog, openWindowLoading } from '@/renderer/common/action'
import {
  addRecentAction,
  clearRecentAction,
  closeConnection,
  getDeviceSymbol,
  initToolBaseSymbol,
  updateModel
} from '@/renderer/pages/nextStudio/action'
import { ipcRenderer } from 'electron'
import {
  VarTreeBoard,
  VarTreeConfig,
  VarTreeCore,
  VarTreeInput,
  VarTreeOutput,
  VarTreePage,
  VarTreeParam,
  VarTreeProcess,
  VarTreeSymbol
} from '@/model/dto'

const { version } = require('../../../../../package.json')

const clearState = async () => {
  await closeConnection()

  store.commit('clearTags')

  store.commit('clearGraphContainer')
  store.commit('setWindowCatalogViewIsVisible', false)
  store.commit('setWindowVariableViewIsVisible', false)
  store.commit('setWindowOutputViewIsVisible', false)
  store.commit('setDeviceDbPath', null)
  store.commit('setDevice', null)
  store.commit('setArchiveProtos', [])
  store.commit('clearSymbolProtoMap')
  for (const key in mxStencilRegistry.stencils) {
    delete mxStencilRegistry.stencils[key]
  }
  store.commit('clearVarTreeStore')
  store.commit('setTplDataType', null)
  store.commit('setTplKEMAType', null)
  store.commit('stopDebugMode')
  VBus.$emit('QUIT_DEBUG_MODE')
  VBus.$emit('REFRESH_MENU_BAR')
}

// 关闭装置
export const closeDevice = async (force = false) => {
  if (force) {
    await clearState()
    return true
  }

  const deviceDbPath = store.getters.deviceDbPath
  const tagDeltaExist = store.getters.tagDeltaExist()

  if (!deviceDbPath || !tagDeltaExist) {
    await clearState()
    return true
  }
  try {
    await MessageBox.confirm('当前装置存在未保存的数据，是否保存？', '提示', {
      distinguishCancelAndClose: true,
      confirmButtonText: '保存',
      cancelButtonText: '不保存',
      type: 'warning',
      center: true
    })
    await store.dispatch('saveAll', true)
    await clearState()
    return true
  } catch (action) {
    if (action === 'cancel') {
      await clearState()
      return true
    } else if (action === 'close') {
      return false
    }
  }
}

// 新建装置
export const newDeviceAction = async () => {
  try {
    // 先关闭当前装置
    const closed = await closeDevice()
    if (!closed) {
      return
    }
  } catch (e) {
    return
  }
  VBus.$emit('OPEN_CREATE_DEVICE_DIALOG')
}
export const createNewDevice = async (newDevice) => {
  const requestData = {
    toolVersion: version,
    name: newDevice.name,
    saveDir: newDevice.directory
  }

  const loading = openWindowLoading('新建装置中...')
  try {
    const projectFilePath = NextStudioService.createDevice(requestData)
    notification.openSuccessNotification(`[Device] 新建装置 ${projectFilePath} 成功`).logger()
    await openDevice(projectFilePath)
  } catch (err) {
    notification.openErrorNotification(`[Device] 新建装置 ${newDevice.name} 失败，${err}`).logger()
  } finally {
    loading.close()
  }
}

export const getIEC61850Tpl = () => {
  NextStudioService.loadTpl().then((result) => {
    if (result) {
      const { dataType, kemaType } = result
      store.commit('setTplDataType', dataType)
      store.commit('setTplKEMAType', kemaType)
    }
  })
}

const initPageRow = (varTreePage, pageData) => {
  if (R.isNotEmpty(pageData.customs)) {
    for (const paramData of pageData.customs) {
      const varTreeParam = new VarTreeParam(paramData, varTreePage)
      varTreePage.customs.push(varTreeParam)
    }
  }

  if (R.isNotEmpty(pageData.symbols)) {
    for (const symbolData of pageData.symbols) {
      const varTreeSymbol = new VarTreeSymbol(symbolData, varTreePage)
      if (R.isNotEmpty(symbolData.inputs)) {
        varTreeSymbol.inputs = symbolData.inputs.map((row) => new VarTreeInput(row, varTreeSymbol))
      }
      if (R.isNotEmpty(symbolData.outputs)) {
        varTreeSymbol.outputs = symbolData.outputs.map((row) => new VarTreeOutput(row, varTreeSymbol))
      }
      if (R.isNotEmpty(symbolData.params)) {
        varTreeSymbol.params = symbolData.params.map((row) => new VarTreeParam(row, varTreeSymbol))
      }
      varTreeSymbol.initChildren()
      varTreePage.symbols.push(varTreeSymbol)
    }
  }

  if (R.isNotEmpty(pageData.pages)) {
    for (const subPage of pageData.pages) {
      const subTreePage = new VarTreePage(subPage, varTreePage)
      initPageRow(subTreePage, subPage)
      varTreePage.pages.push(subTreePage)
    }
  }
  varTreePage.initChildren()
}
const initVarTree = (configData) => {
  if (configData) {
    const varTreeConfig = new VarTreeConfig(configData)
    if (configData.boards && R.isNotEmpty(configData.boards)) {
      for (const boardData of configData.boards) {
        const varTreeBoard = new VarTreeBoard(boardData, varTreeConfig)
        if (boardData.cores && R.isNotEmpty(boardData.cores)) {
          for (const coreData of boardData.cores) {
            const varTreeCore = new VarTreeCore(coreData, varTreeBoard)
            if (coreData.processes && R.isNotEmpty(coreData.processes)) {
              for (const processData of coreData.processes) {
                const varTreeProcess = new VarTreeProcess(processData, varTreeCore)
                if (processData.pages && R.isNotEmpty(processData.pages)) {
                  for (const processPageData of processData.pages) {
                    const varTreePage = new VarTreePage(processPageData, varTreeProcess)
                    initPageRow(varTreePage, processPageData)
                    varTreeProcess.pages.push(varTreePage)
                  }
                }
                // 根据index排序
                varTreeProcess.initChildren()
                varTreeCore.processes.push(varTreeProcess)
              }
            }
            if (coreData.pages && R.isNotEmpty(coreData.pages)) {
              for (const corePage of coreData.pages) {
                const varTreePage = new VarTreePage(corePage, varTreeCore)
                initPageRow(varTreePage, corePage)
                varTreeCore.pages.push(varTreePage)
              }
            }
            // 根据index排序
            varTreeCore.initChildren()
            varTreeBoard.cores.push(varTreeCore)
          }
        }
        varTreeBoard.initChildren()
        varTreeConfig.boards.push(varTreeBoard)
      }
    }
    varTreeConfig.initChildren()
    return varTreeConfig
  }
}
export const generateVarTree = () => {
  const varTreeLoading = store.getters.varTreeLoading
  if (varTreeLoading) {
    notification.openInfoNotification('[VarTree] 请等待之前的变量库初始化完成').logger()
    return
  }

  // TODO 限流
  store.commit('setVarTreeLoading', true)
  notification.openInfoNotification('[VarTree] 变量库初始化中...').logger()
  // 发送事件
  ipcRenderer.invoke('worker:generateVarTree', store.getters.deviceDbPath)
    .then((value) => {
      // 线程返回的对象会丢失类型信息，需要重新构造一遍
      const symbolVarTreeCfg = initVarTree(value.symbol)
      const inputVarTreeCfg = initVarTree(value.input)
      const outputVarTreeCfg = initVarTree(value.output)
      const paramVarTreeCfg = initVarTree(value.param)
      const customVarTreeCfg = initVarTree(value.custom)
      store.commit('setVarTreeCfg', {
        result: {
          symbolVarTreeCfg,
          inputVarTreeCfg,
          outputVarTreeCfg,
          paramVarTreeCfg,
          customVarTreeCfg
        }
      })
      VBus.$emit('REFRESH_VAR_TREE')
      notification.openInfoNotification('[VarTree] 变量库初始化完成').logger()
    })
    .catch((e) => {
      notification.openErrorNotification(`[VarTree] 变量库初始化失败 ${e.message}，请刷新后再试`).logger()
    })
    .finally(() => {
      store.commit('setVarTreeLoading', false)
    })
}
// 初始化装置
const initDevice = (deviceDbPath, device) => {
  // 添加最近打开记录
  addRecentAction(deviceDbPath)
  store.commit('setDeviceDbPath', deviceDbPath)
  store.commit('setDevice', device)
  // 初始化目录
  store.commit('setWindowCatalogViewIsVisible', true)
  store.commit('setWindowVariableViewIsVisible', true)
  store.commit('setWindowOutputViewIsVisible', true)
  VBus.$emit('REFRESH_MENU_BAR')
  // 初始化符号库
  notification.openInfoNotification('[VarTree] 后台初始化中，请稍等...').logger()
  initToolBaseSymbol()
  getDeviceSymbol()
  generateVarTree()
  // FIXME 更新TPL放到什么时候加载？
  getIEC61850Tpl()
}

const openDevice = async (projectFilePath) => {
  let loading
  try {
    //  校验装置版本信息
    /*
        const checkResult = ProjectManageService.checkVersion(projectFilePath, version)
        if (checkResult && checkResult.needUpdate) {
          const operation = await VXETable.modal.confirm({
            title: '需要升级',
            status: 'warning',
            message: checkResult.msg,
            destroyOnClose: true,
            beforeHideMethod: (args) => {
              if (args.type === 'confirm' && checkResult.automatic) {
                loading = openWindowLoading('升级装置中...')
              }
            }
          })
          if (operation === 'confirm' && checkResult.automatic) {
            const msg = await ProjectManageService.upgradeProject(projectFilePath, version)
            if (msg) {
              notification.openWarningNotification(msg).logger()
            }
          } else {
            return
          }
        } */
    loading = openWindowLoading('打开装置文件中...')
    const device = await NextStudioService.openDevice(projectFilePath)
    notification.openSuccessNotification(`[Device] 打开装置文件 ${projectFilePath} 成功`).logger()

    initDevice(projectFilePath, device)
  } catch (err) {
    notification.openErrorNotification(`[Device] 打开装置文件失败 ${err}`).logger()
    throw err
  } finally {
    if (loading) {
      loading.close()
    }
  }
}
// 打开装置
export const openDeviceAction = async () => {
  const extensions = [DEVICE_FILE_NAME, 'plsym']

  const openDialogReturnValue = await openWindowDialog({
    title: '打开装置文件',
    properties: ['openFile'],
    filters: [{ name: '装置文件', extensions }]
  })
  const filePath = getFirstPath(openDialogReturnValue.filePaths)
  if (R.isNil(filePath)) {
    return
  }
  try {
    const closed = await closeDevice()
    if (!closed) {
      return
    }
  } catch (e) {
    return
  }
  if (/\.plsym$/.test(filePath)) {
    // 导入装置
    VBus.$emit('OPEN_IMPORT_DEVICE_DIALOG', filePath)
  } else if (/\.db$/.test(filePath)) {
    await openDevice(filePath)
  }
}
// 打开装置
export const openRecentDeviceAction = async (deviceFilePath) => {
  const exist = fse.pathExistsSync(deviceFilePath)
  if (!exist) {
    try {
      await MessageBox.confirm('要打开的装置文件不存在，是否从历史记录中清除？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      })
      clearRecentAction(deviceFilePath)
      return
    } catch (action) {
      return
    }
  }
  try {
    const closed = await closeDevice()
    if (!closed) {
      return
    }
  } catch (e) {
    return
  }
  await openDevice(deviceFilePath)
}
// 导入装置
export const importPlsym = async ({ name, plsymFilePath, projectSaveDir }) => {
  const loading = openWindowLoading('导入装置文件中...')
  setTimeout(async () => {
    try {
      const projectFilePath = await NextStudioService.importDevice({
        toolVersion: version,
        name,
        plsymPath: plsymFilePath,
        saveDir: projectSaveDir
      })
      notification.openSuccessNotification('[Device] 导入装置文件成功').logger()
      VBus.$emit('CLOSE_IMPORT_DEVICE_DIALOG')
      await openDevice(projectFilePath)
    } catch (err) {
      notification.openErrorNotification(`[Device] 导入装置文件失败 ${err.message}`).logger()
    } finally {
      loading.close()
    }
  }, 100)
}

// 重命名装置
export const renameDevice = (node) => {
  VBus.$emit('OPEN_SIMPLE_DIALOG',
    node,
    '重命名装置',
    [
      {
        title: '装置名称：',
        attr: 'name',
        check: noNilAndEmptyRule('装置名称不能为空')
      }
    ],
    async () => {
      await updateModel(node)
      node.title = node.getTitle()
      notification.openSuccessNotification('重命名装置成功').logger()
    })
}
