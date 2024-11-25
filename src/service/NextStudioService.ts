import { DeviceService } from '@/service/nextStudio/DeviceService'
import {
  ControlGroup,
  CustomGroup,
  EventInfoGroup,
  MainBoardConfig,
  Page,
  RecordGroup,
  ReportGroup,
  SettingGroup,
  StateGroup,
  WaveGroup,
  WaveInst
} from '@/model/dto'
import { MainBoardConfigService } from '@/service/nextStudio/MainBoardConfigService'
import { SettingGroupService } from '@/service/nextStudio/SettingGroupService'
import { StateGroupService } from '@/service/nextStudio/StateGroupService'
import { ControlGroupService } from '@/service/nextStudio/ControlGroupService'
import { RecordGroupService } from '@/service/nextStudio/RecordGroupService'
import { ReportGroupService } from '@/service/nextStudio/ReportGroupService'
import { EventInfoGroupService } from '@/service/nextStudio/EventInfoGroupService'
import { CustomGroupService } from '@/service/nextStudio/CustomGroupService'
import { WaveGroupService } from '@/service/nextStudio/WaveGroupService'
import { PageService } from '@/service/nextStudio/PageService'

export class NextStudioService {
  public static importDevice (requestData: {
    toolVersion: string;
    name?: string;
    plsymPath: string;
    saveDir: string;
  }) {
    return DeviceService.importDevice(requestData)
  }

  public static async openDevice (filePath: string) {
    return DeviceService.openDevice(filePath)
  }

  public static async createDevice (requestData: { saveDir: string; toolVersion: string; name: string }) {
    // TODO
    return ''
  }

  public static async openSymbolArchive () {
    return { pkgList: [], backupPkgList: [] }
  }

  public static async loadTpl () {
    return { dataType: null, kemaType: null }
  }

  public static async generateDeviceCfg (savePath: string, version: any) {
    // TODO
  }

  public static async open (obj: any, deviceName: string) {
    if (!obj) {
      return null
    }
    if (obj instanceof MainBoardConfig) {
      return MainBoardConfigService.openMainBoardConfig(obj, deviceName)
    } else if (obj instanceof SettingGroup) {
      return SettingGroupService.openSettingGroup(obj, deviceName)
    } else if (obj instanceof StateGroup) {
      return StateGroupService.openStateGroup(obj, deviceName)
    } else if (obj instanceof ControlGroup) {
      return ControlGroupService.openControlGroup(obj, deviceName)
    } else if (obj instanceof RecordGroup) {
      return RecordGroupService.openRecordGroup(obj, deviceName)
    } else if (obj instanceof ReportGroup) {
      return ReportGroupService.openReportGroup(obj, deviceName)
    } else if (obj instanceof EventInfoGroup) {
      return EventInfoGroupService.openEventInfoGroup(obj, deviceName)
    } else if (obj instanceof CustomGroup) {
      return CustomGroupService.openCustomGroup(obj, deviceName)
    } else if (obj instanceof WaveInst) {
      return WaveGroupService.openWaveConfig(obj, deviceName)
    } else if (obj instanceof WaveGroup) {
      return WaveGroupService.openWaveGroup(obj, deviceName)
    } else if (obj instanceof Page) {
      return PageService.openPage(obj, deviceName)
    }
    return null
  }
}
