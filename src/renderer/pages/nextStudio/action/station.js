import * as fse from 'fs-extra'
import * as path from 'path'
import * as R from 'ramda'
import { MessageBox } from 'element-ui'
import { openWindowLoading } from '@/renderer/common/action'
import notification from '@/renderer/common/notification'
import logger from '@/renderer/common/logger'
import VBus from '@/renderer/common/vbus'
import store from '@/renderer/pages/nextStudio/store'
import { NextStudioService } from '@/service/NextStudioService'

const getAllJsonTemplateInDir = (dir) => {
  const templates = []
  const tempDirList = fse.readdirSync(dir)
  if (R.isNotEmpty(tempDirList)) {
    for (const tempDir of tempDirList) {
      const tempJsonFilePath = path.join(dir, tempDir)
      if (tempDir.endsWith('.json') && fse.statSync(tempJsonFilePath).isFile()) {
        const template = fse.readJsonSync(tempJsonFilePath)
        templates.push(template)
      }
    }
  }
  return templates
}

export const loadRackTemplates = () => {
  // 获取机箱信息
  const templatePath = path.join(process.cwd(), 'templates')
  if (!fse.pathExistsSync(templatePath)) {
    return
  }
  const rackLib = getAllJsonTemplateInDir(path.join(templatePath, 'rack'))
  store.commit('setRackLib', rackLib)
  // 获取板卡信息
  const boardLib = []
  const boardGroupDir = path.join(templatePath, 'board')
  const boardGroupDirList = fse.readdirSync(boardGroupDir)
  if (R.isNotEmpty(boardGroupDirList)) {
    for (const groupDir of boardGroupDirList) {
      const groupPath = path.join(boardGroupDir, groupDir)
      if (fse.statSync(groupPath).isDirectory()) {
        const group = { name: groupDir, boards: [] }
        group.boards = getAllJsonTemplateInDir(groupPath)
        boardLib.push(group)
      }
    }
  }
  store.commit('setBoardLib', boardLib)
}

// 生成配置文件
export const generateConfigFile = async () => {
  const tagDeltaExist = store.getters.tagDeltaExist
  if (tagDeltaExist) {
    try {
      await MessageBox.confirm('需要先保存工程，是否继续？', '提示', {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      })
      await store.dispatch('saveAll')
    } catch (action) {
      if (action === 'cancel') {
        notification.openInfoNotification('取消生成配置文件')
        return
      }
      notification.openErrorNotification('工程保存失败!请检查错误日志').logger()
      return
    }
  }

  const loading = openWindowLoading('生成配置文件中...')
  setTimeout(() => {
    const deviceDbPath = store.getters.deviceDbPath
    const savePath = path.join(deviceDbPath, '../')
    const { version } = require('../../../../../package.json')
    NextStudioService.generateDeviceCfg(savePath, version)
      .then(result => {
        result.forEach(logger.warn)
        notification.openSuccessNotification('生成配置文件成功').logger()
      })
      .catch(e => {
        notification.openErrorNotification(`生成配置文件失败 ${e.message}`).logger()
      })
      .finally(() => {
        loading.close()
      })
  }, 100)
}
export const comparePackages = (aslPathArray) => {
  const loading = openWindowLoading('对比差异中...')
  return NextStudioService.comparePackages(aslPathArray).finally(() => {
    loading.close()
  })
}

export const analyzePkgCompareResult = (packageCompareResult, vfbPathMap) => {
  const loading = openWindowLoading('分析中...')
  return NextStudioService.analyzePkgCompareResult(packageCompareResult, vfbPathMap).finally(() => {
    loading.close()
  })
}

export const updatePackages = (packageCompareResult, pathIdBindRecords) => {
  return NextStudioService.updatePackages(packageCompareResult, pathIdBindRecords)
}

// 保存当前激活页
export const save = async () => {
  try {
    // 保存全工程
    await store.dispatch('saveAll')
  } catch (e) {
    notification.openErrorNotification(`保存失败, ${e.message}`).logger()
  }
}

export const getObjContext = (obj, deviceName) => {
  return NextStudioService.open(obj, deviceName)
}

export const instanceVFB = (obj, parent) => {
  return NextStudioService.newVFBInstance(obj, parent)
}

export const instanceModel = (obj = {}, pdId) => {
  return NextStudioService.newInstance(obj, pdId)
}

export const pasteSinglePage = (obj, procId) => {
  return NextStudioService.pastePage(obj, procId)
}

export const pasteVfbAndLines = (obj) => {
  return NextStudioService.pasteVfbLineAnnotations(obj)
}

export const pasteLDevice = (obj, apId) => {
  return NextStudioService.pasteLDevice(obj, apId)
}
export const pasteLN = (obj, ldId) => {
  return NextStudioService.pasteLN(obj, ldId)
}
export const pasteDataSet = (obj, ldId) => {
  return NextStudioService.pasteDataSet(obj, ldId)
}

export const deleteModel = (...obj) => {
  return NextStudioService.delete(...obj)
}

export const updateModel = (...obj) => {
  return NextStudioService.update(...obj)
}

export const saveDelta = (delta) => {
  return NextStudioService.save(delta)
}

export const checkExistInOtherSettingGroup = (obj) => {
  // TODO
  return false
  // return NextStudioService.checkExistInOtherSettingGroup(obj)
}

export const openProgramConfig = () => {
  return NextStudioService.openProgramConfig()
}

export const getParamList = (naList) => {
  return NextStudioService.getParamList(naList)
}

export const getAllInterlockGroupId = () => {
  return NextStudioService.getAllInterLockGroupId()
}

export const getAllExtCmd = async () => {
  let result = await NextStudioService.getExtCmdDesc()
  if (!result || R.isEmpty(result)) {
    result = []
    for (let i = 1; i <= 16; i++) {
      result.push({
        key: `cmd${i}`,
        label: `EXT_CMD${i}`,
        desc: `本地命令${i}`
      })
    }
  }
  return result
}

export const search = () => {
  VBus.$emit('OPEN_SEARCH_DIALOG')
}

export const findInProject = (condition) => {
  return NextStudioService.findInProject(condition)
}

export const checkInstNameConflict = (srcData, dstCoreId) => {
  return NextStudioService.checkInstNameConflict(srcData, dstCoreId)
}
