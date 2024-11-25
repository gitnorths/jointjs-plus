import {
  CoreContext,
  PageContext,
  PGSnippetContext,
  ProcessContext,
  ProgramBoardContext,
  ProgramSnippetContext
} from './programConfigContext'
import { DeviceContext } from './deviceContext'
import { SettingGroupConfigContext, SettingGroupContext, SettingManageGroupContext } from './settingGroupConfigContext'
import { SignalGroupConfigContext, SignalGroupContext, SignalManageGroupContext } from './signalGroupContext'
import { getDtoClassName } from '@/renderer/common/util'
import { YesNoEnum } from '@/model/enum'

export function getContextmenuItems (selectDto, debugMode) {
  if (!selectDto) {
    return []
  }

  const selectItemClassName = getDtoClassName(selectDto)
  const isFolder = selectDto.isFolder === YesNoEnum.YES
  switch (selectItemClassName) {
    case 'Device':
      return DeviceContext(debugMode)
    case 'ProgramSnippet':
      return ProgramSnippetContext(debugMode)
    case 'PGSnippet':
      return PGSnippetContext(debugMode)
    case 'ProgramBoard':
      return ProgramBoardContext(debugMode)
    case 'CpuCoreInfo':
      return CoreContext(debugMode, selectDto)
    case 'ProcessItem':
      return ProcessContext(debugMode)
    case 'Page':
      return PageContext(debugMode)

    case 'SettingGroupConfig':
      return SettingGroupConfigContext(debugMode)
    case 'SettingGroup':
      return isFolder ? SettingManageGroupContext(debugMode) : SettingGroupContext(debugMode)

    case 'SignalGroupConfig':
      return SignalGroupConfigContext(debugMode)
    case 'StateGroup':
    case 'ControlGroup':
    case 'ReportGroup':
    case 'RecordGroup':
    case 'EventInfoGroup':
    case 'CustomGroup':
      return isFolder ? SignalManageGroupContext(debugMode, selectDto) : SignalGroupContext(debugMode, selectDto)
    default:
      return []
  }
}
