import * as Base64Coder from 'Base64'
import * as R from 'ramda'
import { create } from 'jsondiffpatch'
import {
  ControlGroup,
  CpuCoreInfo,
  CustomGroup,
  Device,
  DeviceConfig,
  EventInfoGroup,
  FuncKeysConfig,
  HardwareConfig,
  HMIConfig,
  LcdMenuConfig,
  LEDConfigItem,
  MacroDefine,
  MainBoardConfig,
  MainBoardSlotConfig,
  ModelBoard,
  Page,
  PanelConfig,
  PGSnippet,
  ProcessItem,
  ProgramBoard,
  ProgramConfig,
  ProgramSnippet,
  ProtoSymbolArchive,
  ProtoSymbolBlock,
  ProtoSymbolLib,
  RecordGroup,
  ReportGroup,
  SCL,
  SettingGroup,
  SettingGroupConfig,
  SignalGroupConfig,
  StateGroup,
  SymbolArchive,
  SymbolBlock,
  SymbolBlockInst,
  SymbolBlockVarInnerInst,
  SymbolBlockVarInputInst,
  SymbolBlockVarOtherInst,
  SymbolBlockVarOutputInst,
  SymbolBlockVarParamInst,
  SymbolBlockVersion,
  SymbolLib,
  VarTreeBoard,
  VarTreeConfig,
  VarTreeCore,
  VarTreeInput,
  VarTreeOutput,
  VarTreePage,
  VarTreeParam,
  VarTreeProcess,
  VarTreeSymbol,
  WaveConfig,
  WaveGroup,
  WaveGroupConfig,
  WaveInst
} from '@/model/dto'
import notification from '@/renderer/common/notification'
import { YesNoEnum } from '@/model/enum'

export const base64Encode = Base64Coder.btoa
export const base64Decode = Base64Coder.atob

export const noNilAndEmptyRule = (message = '值不能为空') => {
  return (val) => {
    if (R.isNil(val) || Object.is('', val)) {
      if (!R.isNil(message)) {
        notification.openWarningNotification(message)
      }
      return false
    }
    return true
  }
}

export const getFirstPath = (filePaths) => {
  if (R.isNil(filePaths) || R.isEmpty(filePaths)) {
    return null
  }
  return R.head(filePaths)
}

// 获取studio的tagkey
export const getTagKey = (item) => {
  if (item) {
    return `${getDtoClassName(item)}-${item.id}`
  }
  return ''
}
// 获取符号制作工具的tagKey
export const getWorkTagKey = (item) => {
  if (item) {
    return `${item.pathId}-${getDtoClassName(item)}`
  }
  return ''
}

export const cellValueEq = (orgVal, newVal) => {
  let changed
  const isOrgNilOrEmpty = R.isNil(orgVal) || orgVal === ''
  const isNewNilOrEmpty = R.isNil(newVal) || newVal === ''
  if (isOrgNilOrEmpty && !isNewNilOrEmpty) {
    changed = true
  } else if (!isOrgNilOrEmpty && isNewNilOrEmpty) {
    changed = true
  } else if (!isOrgNilOrEmpty && !isNewNilOrEmpty) {
    if (R.is(String, orgVal) || R.is(Number, orgVal)) {
      // eslint-disable-next-line eqeqeq
      changed = orgVal != newVal
    } else {
      changed = !R.equals(orgVal, newVal)
    }
  } else {
    changed = false
  }
  return changed
}

export const objDiff = (options, propertyFilter, arrays) => {
  const defaultOptions = {
    objectHash: (item) => {
      // this function is used only to when objects are not equal by ref
      return item.id
    },
    arrays: {
      detectMove: true,
      includeValueOnMove: false
    },
    textDiff: {
      minLength: 60
    },
    cloneDiffValues: false
  }

  if (options) {
    if (options.objectHash) {
      defaultOptions.objectHash = options.objectHash
    }
    if (options.propertyFilter) {
      defaultOptions.propertyFilter = options.propertyFilter
    }
    if (options.arrays) {
      defaultOptions.arrays = options.arrays
    }
  }
  return create(defaultOptions)
}

export const getDtoClassName = (data) => {
  if (!data) {
    return ''
  }
  if (data instanceof SymbolArchive) return 'SymbolArchive'
  if (data instanceof SymbolLib) return 'SymbolLib'
  if (data instanceof SymbolBlock) return 'SymbolBlock'
  if (data instanceof SymbolBlockVersion) return 'SymbolBlockVersion'
  if (data instanceof Device) return 'Device'
  if (data instanceof DeviceConfig) return 'DeviceConfig'
  if (data instanceof ModelBoard) return 'ModelBoard'
  if (data instanceof HardwareConfig) return 'HardwareConfig'
  if (data instanceof MainBoardConfig) return 'MainBoardConfig'
  if (data instanceof MainBoardSlotConfig) return 'MainBoardSlotConfig'
  if (data instanceof PanelConfig) return 'PanelConfig'
  if (data instanceof LEDConfigItem) return 'LEDConfigItem'
  if (data instanceof FuncKeysConfig) return 'FuncKeysConfig'
  if (data instanceof ProgramConfig) return 'ProgramConfig'
  if (data instanceof ProgramSnippet) return 'ProgramSnippet'
  if (data instanceof PGSnippet) return 'PGSnippet'
  if (data instanceof ProgramBoard) return 'ProgramBoard'
  if (data instanceof CpuCoreInfo) return 'CpuCoreInfo'
  if (data instanceof ProcessItem) return 'ProcessItem'
  if (data instanceof Page) return 'Page'
  if (data instanceof SymbolBlockInst) return 'SymbolBlockInst'
  if (data instanceof SymbolBlockVarInputInst) return 'SymbolBlockVarInputInst'
  if (data instanceof SymbolBlockVarOutputInst) return 'SymbolBlockVarOutputInst'
  if (data instanceof SymbolBlockVarParamInst) return 'SymbolBlockVarParamInst'
  if (data instanceof SymbolBlockVarInnerInst) return 'SymbolBlockVarInnerInst'
  if (data instanceof SymbolBlockVarOtherInst) return 'SymbolBlockVarOtherInst'
  if (data instanceof ProtoSymbolArchive) return 'ProtoSymbolArchive'
  if (data instanceof ProtoSymbolLib) return 'ProtoSymbolLib'
  if (data instanceof ProtoSymbolBlock) return 'ProtoSymbolBlock'

  if (data instanceof MacroDefine) return 'MacroDefine'
  if (data instanceof SignalGroupConfig) return 'SignalGroupConfig'
  if (data instanceof StateGroup) return 'StateGroup'
  if (data instanceof ControlGroup) return 'ControlGroup'
  if (data instanceof ReportGroup) return 'ReportGroup'
  if (data instanceof RecordGroup) return 'RecordGroup'
  if (data instanceof EventInfoGroup) return 'EventInfoGroup'
  if (data instanceof CustomGroup) return 'CustomGroup'
  if (data instanceof SettingGroupConfig) return 'SettingGroupConfig'
  if (data instanceof SettingGroup) return 'SettingGroup'
  if (data instanceof HMIConfig) return 'HMIConfig'
  if (data instanceof LcdMenuConfig) return 'LcdMenuConfig'
  if (data instanceof WaveGroupConfig) return 'WaveGroupConfig'
  if (data instanceof WaveInst) return 'WaveInst'
  if (data instanceof WaveConfig) return 'WaveConfig'
  if (data instanceof WaveGroup) return 'WaveGroup'
  // TODO
  if (data.constructor) {
    return data.constructor.name
  }
  return 'OBJECT'
}

export const getIconClass = (data) => {
  if (!data) return ''
  if (data instanceof SymbolArchive) return 'fa fa-cubes'
  if (data instanceof SymbolLib) return 'fa fa-cube'
  if (data instanceof SymbolBlock) return 'fa fa-microchip'
  if (data instanceof SymbolBlockVersion) return 'fa fa-hashtag'

  if (data instanceof Device || data instanceof VarTreeConfig) return 'fa fa-database'
  if (data instanceof HardwareConfig) return 'fa fa-memory'
  if (data instanceof MainBoardConfig) return 'fa fa-diagram-successor'
  if (data instanceof PanelConfig) return 'fa fa-diagram-predecessor'
  if (data instanceof ProgramConfig) return 'fa fa-diagram-project'
  if (data instanceof ProgramSnippet) return 'fa fa-puzzle-piece'
  if (data instanceof PGSnippet) return 'fa fa-draw-polygon'
  if (data instanceof ProgramBoard || data instanceof VarTreeBoard) return 'fa fa-mattress-pillow'
  if (data instanceof CpuCoreInfo || data instanceof VarTreeCore) return 'fa fa-microchip'
  if (data instanceof ProcessItem || data instanceof VarTreeProcess) return 'fa fa-bars-progress'
  if (data instanceof Page || data instanceof VarTreePage) {
    return data.isSnippet
      ? 'fa fa-circle-nodes'
      : data.isFolder
        ? 'far fa-object-ungroup'
        : 'fa fa-vector-square'
  }
  if (data instanceof DeviceConfig) return 'fa fa-gears'
  if (data instanceof SignalGroupConfig) return 'fa fa-table-list'
  if (data instanceof SettingGroupConfig) return 'fa fa-sliders'

  if (data instanceof SettingGroup || data instanceof StateGroup || data instanceof ControlGroup || data instanceof RecordGroup || data instanceof ReportGroup || data instanceof EventInfoGroup || data instanceof CustomGroup) {
    if (data.reserved) {
      return data.isFolder === YesNoEnum.YES ? 'fa fa-cubes' : 'fa fa-cube'
    } else {
      return data.isFolder === YesNoEnum.YES ? 'fa fa-tags' : 'fa fa-tag'
    }
  }
  if (data instanceof HMIConfig) return 'fa fa-display'
  if (data instanceof LcdMenuConfig) return 'fa fa-folder-tree'
  if (data instanceof WaveGroupConfig) return 'fa fa-wave-square'
  if (data instanceof WaveInst) return 'far fa-rectangle-list'
  if (data instanceof WaveGroup) return 'fa fa-file-waveform'
  if (data instanceof SCL) return 'fa fa-envelope'

  if (data instanceof VarTreeSymbol) return 'fa fa-qrcode'
  if (data instanceof VarTreeInput) return 'fa fa-arrow-right-to-bracket'
  if (data instanceof VarTreeOutput) return 'fa fa-arrow-right-from-bracket'
  if (data instanceof VarTreeParam) return 'fa fa-inbox'
  return ''
}

export const compareVersion = (a, b) => {
  const aArray = a.split('.')
  const bArray = b.split('.')
  if (aArray[0] !== bArray[0]) {
    return Number(aArray[0]) - Number(bArray[0])
  }
  if (aArray[1] !== bArray[1]) {
    return Number(aArray[1]) - Number(bArray[1])
  }
  if (aArray[2].indexOf('-beta') > 0) {
    if (bArray[2].indexOf('-beta') > 0) {
      // 比较的两个版本号都是beta版
      const aLastVersion = aArray[2].split('-beta')[0]
      const bLastVersion = bArray[2].split('-beta')[0]
      const aBetaVersion = aArray[2].split('-beta')[1]
      const bBetaVersion = bArray[2].split('-beta')[1]
      if (aLastVersion !== bLastVersion) {
        return Number(aLastVersion) - Number(bLastVersion)
      }
      return Number(aBetaVersion) - Number(bBetaVersion)
    }
    // a是beta版本，b是正式版
    const aLastVersion = aArray[2].split('-beta')[0]
    if (aLastVersion !== bArray[2]) {
      return Number(aLastVersion) - Number(bArray[2])
    }
    return -1
  }
  if (bArray[2].indexOf('-beta') > 0) {
    // a是正式版本，b是beta版
    const bLastVersion = bArray[2].split('-beta')[0]
    if (bLastVersion !== aArray[2]) {
      return Number(aArray[2]) - Number(bLastVersion)
    }
    return 1
  }
  // a、b都是正式版
  return Number(aArray[2]) - Number(bArray[2])
}

/* 判断平台版本 a < b ，兼容性比较不考虑patch版本
 * R1   . 00  .  000  . 00
 * main . sub . minor . patch
 */
export const isPlatVersionLT = (a, b) => {
  const [mainA, subA, minorA] = a.split('.')
  const [mainB, subB, minorB] = b.split('.')
  const mainANum = mainA.replace('R', '')
  const mainBNum = mainB.replace('R', '')

  if (R.equals(mainANum, mainBNum)) {
    if (R.equals(subA, subB)) {
      return Number(minorA) < Number(minorB)
    } else {
      return Number(subA) < Number(subB)
    }
  } else {
    return Number(mainANum) < Number(mainBNum)
  }
}

export const isPlatVersionGT = (a, b) => {
  return !isPlatVersionLT(a, b)
}
