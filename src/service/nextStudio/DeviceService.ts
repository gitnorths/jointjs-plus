import * as path from 'path'
import * as R from 'ramda'
import * as fse from 'fs-extra'
import {
  ControlGroup,
  CpuCoreInfo,
  Device,
  DeviceConfig,
  EventInfoGroup,
  HardwareConfig,
  HMIConfig,
  LcdMenu,
  LcdMenuConfig,
  MainBoardConfig,
  Page,
  PanelConfig,
  PGSnippet,
  ProcessItem,
  ProgramBoard,
  ProgramConfig,
  ProgramSnippet,
  RecordGroup,
  ReportGroup,
  SettingGroup,
  SettingGroupConfig,
  SignalGroupConfig,
  StateGroup,
  WaveGroup,
  WaveGroupConfig,
  WaveInst
} from '@/model/dto'

import {
  ConnectLineEntity,
  ConnectLineRouterPointsEntity,
  ControlGroupEntity,
  ControlGroupItemEntity,
  DeviceEntity,
  EventInfoGroupEntity,
  EventInfoGroupItemEntity,
  HWConfigEntity,
  HWFuncKeysEntity,
  HWSlotConfigEntity,
  LabelInEntity,
  LabelOutEntity,
  LcdMenuEntity,
  LcdMenuRefDataEntity,
  LEDConfigItemEntity,
  LinkDotInstEntity,
  MacroDefineEntity,
  ModelBoardEntity,
  ModelRackEntity,
  ModelRackSlotEntity,
  PageAnnotationEntity,
  PageEntity,
  PGCoreInfoEntity,
  PGOptBoardEntity,
  PGSnippetEntity,
  ProcessItemEntity,
  ProtoSymbolArchiveEntity,
  ProtoSymbolBlockEntity,
  ProtoSymbolLibEntity,
  RecordGroupEntity,
  RecordGroupItemEntity,
  ReportGroupEntity,
  ReportGroupItemEntity,
  SettingGroupEntity,
  SettingGroupItemEntity,
  SettingGroupItemMergeEntity,
  StateGroupEntity,
  StateGroupItemEntity,
  SymbolBlockInstEntity,
  SymbolBlockVarInnerInstEntity,
  SymbolBlockVarInputInstEntity,
  SymbolBlockVarOtherInstEntity,
  SymbolBlockVarOutputInstEntity,
  SymbolBlockVarParamInstEntity,
  WaveConfigEntity,
  WaveFrequencyItemEntity,
  WaveGroupEntity,
  WaveGroupItemEntity,
  WaveInstEntity
} from '@/service/entity/deviceEntities'
import { DeviceLoader } from '@/service/nextStudio/DeviceLoader'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { Dao } from '@/service/dao'
import { EntityManager } from 'typeorm'
import { DEVICE_FILE_EXT_NAME } from '@/util/consts'
import { TreeNode } from '@/model/dto/TreeNode'

export class DeviceService {
  static async openDevice (dbPath: string) {
    // 检查路径是否存在
    if (!dbPath.endsWith(DEVICE_FILE_EXT_NAME)) {
      throw new Error(`打开装置失败！${dbPath}文件名错误，请选择*${DEVICE_FILE_EXT_NAME}文件`)
    }
    const realPath = path.resolve(dbPath)
    if (!fse.existsSync(realPath)) {
      throw new Error(`打开装置失败！${realPath}不存在`)
    }
    const dbName = path.basename(realPath, DEVICE_FILE_EXT_NAME)
    const dataSource = await DataSourceManager.createDeviceDataSource(dbName, realPath)

    const deviceEntities = await dataSource.getRepository(DeviceEntity).find()
    if (R.isEmpty(deviceEntities)) {
      // 不存在实体
      throw new Error('打开装置失败！数据为空')
    } else if (deviceEntities.length > 1) {
      throw new Error('打开装置失败！存在脏数据')
    }
    const deviceEntity = deviceEntities[0]
    const hardwareConfigEntities = await dataSource.getRepository(HWConfigEntity).find()
    // FIXME
    const hardwareConfigEntity = hardwareConfigEntities[0]
    const snipptes = await dataSource.getRepository(PGSnippetEntity).find()
    const optBoards = await dataSource.getRepository(PGOptBoardEntity).find({ relations: ['cpuCores', 'cpuCores.processItems'] })
    // const coreEntities = await dataSource.getRepository(PGCoreInfoEntity).find()
    // const processEntities = await dataSource.getRepository(ProcessItemEntity).find()
    const pageEntites = await dataSource.getRepository(PageEntity).find()

    const stateGroupEntities = await dataSource.getRepository(StateGroupEntity).find()
    const controlGroupEntities = await dataSource.getRepository(ControlGroupEntity).find()
    const recordGroupEntities = await dataSource.getRepository(RecordGroupEntity).find()
    const reportGroupEntities = await dataSource.getRepository(ReportGroupEntity).find()
    const eventInfoGroupEntities = await dataSource.getRepository(EventInfoGroupEntity).find()
    // TODO
    // const customGroupEntities = await dataSource.getRepository(CustomGroupEntity).find()

    const snippetPageMap = new Map<string, PageEntity[]>()
    const corePageMap = new Map<string, PageEntity[]>()
    const processPageMap = new Map<string, PageEntity[]>()
    const pagePageMap = new Map<string, PageEntity[]>()
    if (R.isNotEmpty(pageEntites)) {
      for (const pageEntity of pageEntites) {
        if (pageEntity.snippetId) {
          const arr = snippetPageMap.get(pageEntity.snippetId) || []
          arr.push(pageEntity)
          snippetPageMap.set(pageEntity.snippetId, arr)
        } else if (pageEntity.coreId) {
          const arr = corePageMap.get(pageEntity.coreId) || []
          arr.push(pageEntity)
          corePageMap.set(pageEntity.coreId, arr)
        } else if (pageEntity.processItemId) {
          const arr = processPageMap.get(pageEntity.processItemId) || []
          arr.push(pageEntity)
          processPageMap.set(pageEntity.processItemId, arr)
        } else if (pageEntity.parentPageId) {
          const arr = pagePageMap.get(pageEntity.parentPageId) || []
          arr.push(pageEntity)
          pagePageMap.set(pageEntity.parentPageId, arr)
        }
      }
    }

    const settingGroupEntities = await dataSource.getRepository(SettingGroupEntity).find()

    const lcdMenuEntities = await dataSource.getRepository(LcdMenuEntity).find()
    const waveInstEntities = await dataSource.getRepository(WaveInstEntity).find({ order: { inst: 'ASC' } })
    const waveGroupEntities = await dataSource.getRepository(WaveGroupEntity).find()

    // 查找所有树节点，懒加载
    const device = new Device(deviceEntity)
    device.hardware = new HardwareConfig(hardwareConfigEntity, device)
    device.hardware.mainBoardConfig = new MainBoardConfig(null, device.hardware)
    device.hardware.panelConfig = new PanelConfig(null, device.hardware)
    device.hardware.initChildren()

    device.program = new ProgramConfig(device)
    device.program.snippet = new ProgramSnippet(device.program)
    if (R.isNotEmpty(snipptes)) {
      for (const snippetEntity of snipptes) {
        const snippet = new PGSnippet(snippetEntity, device.program.snippet)
        const pageEntities = snippetPageMap.get(snippet.id)
        if (pageEntities && R.isNotEmpty(pageEntities)) {
          for (const pageEntity of pageEntities) {
            const page = new Page(pageEntity, snippet)
            this.convertPageEntity(page, pagePageMap)
            snippet.pages.push(page)
          }
        }
        // 根据index排序
        snippet.pages = snippet.pages.sort((a, b) => a.index - b.index)
        snippet.initChildren()
        device.program.snippet.snippets.push(snippet)
      }
    }
    device.program.snippet.initChildren()
    if (R.isNotEmpty(optBoards)) {
      for (const optBoardEntity of optBoards) {
        const optBoard = new ProgramBoard(optBoardEntity, device.program)
        if (R.isNotEmpty(optBoardEntity.cpuCores)) {
          for (const coreEntity of optBoardEntity.cpuCores) {
            const cpuCore = new CpuCoreInfo(coreEntity, optBoard)
            if (R.isNotEmpty(coreEntity.processItems)) {
              for (const processEntity of coreEntity.processItems) {
                const processItem = new ProcessItem(processEntity, cpuCore)
                const pageEntities = processPageMap.get(processItem.id)
                if (pageEntities && R.isNotEmpty(pageEntities)) {
                  for (const pageEntity of pageEntities) {
                    const page = new Page(pageEntity, processItem)
                    this.convertPageEntity(page, pagePageMap)
                    processItem.pages.push(page)
                  }
                }
                // 根据index排序
                processItem.pages = processItem.pages.sort((a, b) => a.index - b.index)
                processItem.initChildren()
                cpuCore.processItems.push(processItem)
              }
            }
            const pageEntities = corePageMap.get(cpuCore.id)
            if (pageEntities && R.isNotEmpty(pageEntities)) {
              for (const pageEntity of pageEntities) {
                const page = new Page(pageEntity, cpuCore)
                this.convertPageEntity(page, pagePageMap)
                cpuCore.pages.push(page)
              }
            }
            // 根据index排序
            cpuCore.processItems = cpuCore.processItems.sort((a, b) => a.index - b.index)
            cpuCore.pages = cpuCore.pages.sort((a, b) => a.index - b.index)
            cpuCore.initChildren()
            optBoard.cpuCores.push(cpuCore)
          }
        }
        optBoard.cpuCores = optBoard.cpuCores.sort((a, b) => {
          if (a.cpuIndex === b.cpuIndex) {
            return a.coreIndex - b.coreIndex
          } else {
            return a.cpuIndex - b.cpuIndex
          }
        })
        optBoard.initChildren()
        device.program.optBoards.push(optBoard)
      }
    }
    device.program.optBoards = device.program.optBoards.sort((a, b) => a.slot - b.slot)
    device.program.initChildren()

    device.config = new DeviceConfig(device)
    device.config.signalGroup = new SignalGroupConfig(device.config)
    if (R.isNotEmpty(stateGroupEntities)) {
      const nullParentGroupEntities = stateGroupEntities.filter((group) => !group.parentGroupId)
      if (R.isEmpty(nullParentGroupEntities)) {
        throw new Error('打开状态分组失败，缺少STATE_TABLE数据')
      } else if (nullParentGroupEntities.length > 1) {
        throw new Error('打开状态分组失败，存在脏数据' + nullParentGroupEntities.length)
      }

      const stateGroup = new StateGroup(nullParentGroupEntities[0], device.config.signalGroup)
      this.convertGroupEntity<StateGroup, StateGroupEntity>(stateGroup, stateGroupEntities, StateGroup)
      device.config.signalGroup.stateGroup = stateGroup
    }
    if (R.isNotEmpty(controlGroupEntities)) {
      const nullParentGroupEntities = controlGroupEntities.filter((group) => !group.parentGroupId)
      if (R.isEmpty(nullParentGroupEntities)) {
        throw new Error('打开控制分组失败，缺少CTRL_TABLE数据')
      } else if (nullParentGroupEntities.length > 1) {
        throw new Error('打开控制分组失败，存在脏数据')
      }

      const group = new ControlGroup(nullParentGroupEntities[0], device.config.signalGroup)
      this.convertGroupEntity<ControlGroup, ControlGroupEntity>(group, controlGroupEntities, ControlGroup)
      device.config.signalGroup.controlGroup = group
    }
    if (R.isNotEmpty(recordGroupEntities)) {
      const nullParentGroupEntities = recordGroupEntities.filter((group) => !group.parentGroupId)
      if (R.isEmpty(nullParentGroupEntities)) {
        throw new Error('打开纪录类分组失败，缺少RECORD_TABLE数据')
      } else if (nullParentGroupEntities.length > 1) {
        throw new Error('打开纪录类分组失败，存在脏数据')
      }

      const group = new RecordGroup(nullParentGroupEntities[0], device.config.signalGroup)
      this.convertGroupEntity<RecordGroup, RecordGroupEntity>(group, recordGroupEntities, RecordGroup)
      device.config.signalGroup.recordGroup = group
    }
    if (R.isNotEmpty(reportGroupEntities)) {
      const nullParentGroupEntities = reportGroupEntities.filter((group) => !group.parentGroupId)
      if (R.isEmpty(nullParentGroupEntities)) {
        throw new Error('打开报告类分组失败，缺少REPORT_TABLE数据')
      } else if (nullParentGroupEntities.length > 1) {
        throw new Error('打开报告类分组失败，存在脏数据')
      }

      const group = new ReportGroup(nullParentGroupEntities[0], device.config.signalGroup)
      this.convertGroupEntity<ReportGroup, ReportGroupEntity>(group, reportGroupEntities, ReportGroup)
      device.config.signalGroup.reportGroup = group
    }
    if (R.isNotEmpty(eventInfoGroupEntities)) {
      const nullParentGroupEntities = eventInfoGroupEntities.filter((group) => !group.parentGroupId)
      if (R.isEmpty(nullParentGroupEntities)) {
        throw new Error('打开事件类分组失败，缺少EVENT_INFO_TABLE数据')
      } else if (nullParentGroupEntities.length > 1) {
        throw new Error('打开事件类分组失败，存在脏数据')
      }

      const group = new EventInfoGroup(nullParentGroupEntities[0], device.config.signalGroup)
      this.convertGroupEntity<EventInfoGroup, EventInfoGroupEntity>(group, eventInfoGroupEntities, EventInfoGroup)
      device.config.signalGroup.eventGroup = group
    }
    device.config.signalGroup.initChildren()

    device.config.settingGroup = new SettingGroupConfig(deviceEntity, device.config)
    if (R.isNotEmpty(settingGroupEntities)) {
      const groupMap = new Map<string, SettingGroupEntity[]>()
      const nullParentGroupEntities = []
      for (const groupEntity of settingGroupEntities) {
        if (groupEntity.parentGroupId) {
          const arr = groupMap.get(groupEntity.parentGroupId) || []
          arr.push(groupEntity)
          groupMap.set(groupEntity.parentGroupId, arr)
        } else {
          nullParentGroupEntities.push(groupEntity)
        }
      }
      if (R.isEmpty(nullParentGroupEntities)) {
        throw new Error('打开定值类分组失败，缺少数据')
      }

      for (const groupEntity of nullParentGroupEntities) {
        const group = new SettingGroup(groupEntity, device.config.settingGroup)
        this.convertSettingGroupEntity(group, groupMap)
        device.config.settingGroup.settingGroups.push(group)
      }
    }
    device.config.settingGroup.settingGroups = device.config.settingGroup.settingGroups.sort((a, b) => a.index - b.index)
    device.config.settingGroup.initChildren()

    device.config.hmiConfig = new HMIConfig(device.config)
    device.config.hmiConfig.lcdMenu = new LcdMenuConfig(device.config.hmiConfig)

    if (R.isNotEmpty(lcdMenuEntities)) {
      const menuMap = new Map<string, LcdMenuEntity[]>()
      const nullParentMenuEntities = []
      for (const lcdMenuEntity of lcdMenuEntities) {
        if (lcdMenuEntity.parentMenuId) {
          const arr = menuMap.get(lcdMenuEntity.parentMenuId) || []
          arr.push(lcdMenuEntity)
          menuMap.set(lcdMenuEntity.parentMenuId, arr)
        } else {
          nullParentMenuEntities.push(lcdMenuEntity)
        }
      }
      if (R.isNotEmpty(nullParentMenuEntities)) {
        for (const menuEntity of nullParentMenuEntities) {
          const lcdMenu = new LcdMenu(menuEntity)
          this.convertLcdMenuEntity(lcdMenu, menuMap)
          device.config.hmiConfig.lcdMenu.menus.push(lcdMenu)
        }
      }
    }
    device.config.hmiConfig.lcdMenu.menus = device.config.hmiConfig.lcdMenu.menus.sort((a, b) => a.index - b.index)

    device.config.hmiConfig.waveConfig = new WaveGroupConfig(device.config.hmiConfig)
    if (R.isNotEmpty(waveInstEntities)) {
      const waveGroupG = R.groupBy<WaveGroupEntity>(R.prop('instId'))(waveGroupEntities)

      for (const waveInstEntity of waveInstEntities) {
        const waveInst = new WaveInst(waveInstEntity, device.config.hmiConfig)
        const waveGroups = waveGroupG[waveInst.id]
        if (waveGroups && R.isNotEmpty(waveGroups)) {
          waveInst.waveGroups = waveGroups.map(groupEntity => new WaveGroup(groupEntity))
        }
        waveInst.initChildren()
        device.config.hmiConfig.waveConfig.insts.push(waveInst)
      }
    }
    device.config.hmiConfig.waveConfig.insts = device.config.hmiConfig.waveConfig.insts.sort((a, b) => a.inst - b.inst)
    device.config.hmiConfig.waveConfig.initChildren()

    device.config.hmiConfig.initChildren()

    device.config.initChildren()
    device.initChildren()
    return device
  }

  private static convertGroupEntity<
    T extends { id: string, childGroups: any[] } & TreeNode<any, any>,
    U extends { parentGroupId: string }
  > (group: T, groupEntities: U[], ctor: new (props?: any, parent?: any) => T) {
    const groupMap = new Map<string, U[]>()
    for (const groupEntity of groupEntities) {
      if (groupEntity.parentGroupId) {
        const arr = groupMap.get(groupEntity.parentGroupId) || []
        arr.push(groupEntity)
        groupMap.set(groupEntity.parentGroupId, arr)
      }
    }
    this.convertSubGroupEntity(group, groupMap, ctor)
  }

  private static convertSubGroupEntity<
    T extends { id: string, childGroups: any[] } & TreeNode<any, any>,
    U extends { parentGroupId: string }
  > (parentGroup: T, groupMap: Map<string, U[]>, ctor: new (props?: any, parent?: any) => T) {
    const groupEntities = groupMap.get(parentGroup.id)
    if (groupEntities && R.isNotEmpty(groupEntities)) {
      for (const groupEntity of groupEntities) {
        const group = new ctor(groupEntity, parentGroup)
        this.convertSubGroupEntity(group, groupMap, ctor)
        parentGroup.childGroups.push(group)
      }
    }
    parentGroup.childGroups = parentGroup.childGroups.sort((a, b) => a.index - b.index)
    parentGroup.initChildren()
  }

  private static convertSettingGroupEntity (parentGroup: SettingGroup, groupMap: Map<string, SettingGroupEntity[]>) {
    const groupEntities = groupMap.get(parentGroup.id)
    if (groupEntities && R.isNotEmpty(groupEntities)) {
      for (const groupEntity of groupEntities) {
        const group = new SettingGroup(groupEntity, parentGroup)
        this.convertSettingGroupEntity(group, groupMap)
        parentGroup.childGroups.push(group)
      }
    }
    parentGroup.childGroups = parentGroup.childGroups.sort((a, b) => a.index - b.index)
    parentGroup.initChildren()
  }

  private static convertLcdMenuEntity (parentMenu: LcdMenu, groupMap: Map<string, LcdMenuEntity[]>) {
    const menuEntities = groupMap.get(parentMenu.id)
    if (menuEntities && R.isNotEmpty(menuEntities)) {
      for (const menuEntity of menuEntities) {
        const lcdMenu = new LcdMenu(menuEntity)
        this.convertLcdMenuEntity(lcdMenu, groupMap)
        parentMenu.menus.push(lcdMenu)
      }
    }
    parentMenu.menus = parentMenu.menus.sort((a, b) => a.index - b.index)
  }

  private static convertPageEntity (parentPage: Page, pagePageMap: Map<string, PageEntity[]>) {
    const pgEntities = pagePageMap.get(parentPage.id)
    if (pgEntities && R.isNotEmpty(pgEntities)) {
      for (const pgEntity of pgEntities) {
        const pg = new Page(pgEntity, parentPage)
        this.convertPageEntity(pg, pagePageMap)
        parentPage.pages.push(pg)
      }
    }
    parentPage.pages = parentPage.pages.sort((a, b) => a.index - b.index)
    parentPage.initChildren()
  }

  static async importDevice (requestData: { toolVersion: string; name?: string; plsymPath: string; saveDir: string; }) {
    const { toolVersion, plsymPath, saveDir, name } = requestData
    // 验证路径
    const { realPath, dataBasePath, deviceName } = this.checkPathValid(plsymPath, saveDir, name)
    // 数据转换
    const device = new DeviceLoader().loadDevice(realPath, deviceName)
    // 工具版本
    device.toolVersion = toolVersion
    // 保存数据
    await this.saveToDb(device, dataBasePath)
    // 数据入库
    return dataBasePath
  }

  private static checkPathValid (plsymPath: string, destPath: string, name?: string) {
    if (!plsymPath || !plsymPath.endsWith('.plsym')) {
      throw new Error('导入装置失败！请选择*.plsym文件.')
    }
    const realPath = path.resolve(__dirname, plsymPath)

    if (!fse.existsSync(realPath)) {
      throw new Error(`导入装置失败！${realPath}不存在`)
    }
    if (!fse.statSync(realPath).isFile()) {
      throw new Error(`导入装置失败！${realPath}不是有效的文件`)
    }

    const deviceName = name || path.basename(path.dirname(path.dirname(realPath)))

    const archiveDir = path.join(destPath, deviceName)
    const existDir = fse.existsSync(archiveDir)
    if (existDir) {
      throw new Error(`导入装置失败！与 '${deviceName}' 同名的目录已存在，请重新选择路径。`)
    }
    const dataBasePath = path.join(archiveDir, `${deviceName}${DEVICE_FILE_EXT_NAME}`)

    return { realPath, dataBasePath, deviceName }
  }

  private static async saveToDb (device: Device, dataBasePath: string) {
    const archiveEntities: ProtoSymbolArchiveEntity[] = []
    const libEntities: ProtoSymbolLibEntity[] = []
    const symbolBlockEntities: ProtoSymbolBlockEntity[] = []
    // 模板
    const rackEntities: ModelRackEntity [] = []
    const rackSlotEntities: ModelRackSlotEntity[] = []
    const boardEntities: ModelBoardEntity[] = []
    // 硬件配置
    let hardwareEntity: HWConfigEntity
    const slotCfgEntities: HWSlotConfigEntity[] = []
    const funcKeyEntities: HWFuncKeysEntity[] = []
    const ledConfigEntities: LEDConfigItemEntity[] = []

    const snippetEntities: PGSnippetEntity[] = []
    const optBoardEntities: PGOptBoardEntity[] = []
    const coreEntities: PGCoreInfoEntity[] = []
    const processEntities: ProcessItemEntity[] = []
    const pageEntities: PageEntity[] = []
    const labelInEntities: LabelInEntity[] = []
    const labelOutEntities: LabelOutEntity[] = []
    const linkDotEntities: LinkDotInstEntity[] = []
    const annotationEntities: PageAnnotationEntity[] = []
    const lineEntities: ConnectLineEntity[] = []
    const routerPointEntities: ConnectLineRouterPointsEntity[] = []
    const blockInstEntities: SymbolBlockInstEntity[] = []
    const inputEntities: SymbolBlockVarInputInstEntity[] = []
    const outputEntities: SymbolBlockVarOutputInstEntity[] = []
    const paramEntities: SymbolBlockVarParamInstEntity[] = []
    const innerEntities: SymbolBlockVarInnerInstEntity[] = []
    const otherEntities: SymbolBlockVarOtherInstEntity[] = []
    const macroDefineEntities: MacroDefineEntity[] = []
    const settingGroupEntities: SettingGroupEntity[] = []
    const settingGroupItemEntities: SettingGroupItemEntity[] = []
    const settingGroupItemMergeEntities: SettingGroupItemMergeEntity[] = []
    const lcdMenuEntities: LcdMenuEntity[] = []
    const lcdRefDataEntities: LcdMenuRefDataEntity[] = []
    const waveInstEntities: WaveInstEntity[] = []
    const waveConfigEntities: WaveConfigEntity[] = []
    const waveFreqEntities: WaveFrequencyItemEntity[] = []
    const waveGroupEntities: WaveGroupEntity[] = []
    const waveGroupItemEntities: WaveGroupItemEntity[] = []
    const stateGroupEntities: StateGroupEntity[] = []
    const stateGroupItemEntities: StateGroupItemEntity[] = []
    const controlGroupEntities: ControlGroupEntity[] = []
    const controlGroupItemEntities: ControlGroupItemEntity[] = []
    const recordGroupEntities: RecordGroupEntity[] = []
    const recordGroupItemEntities: RecordGroupItemEntity[] = []
    const reportGroupEntities: ReportGroupEntity[] = []
    const reportGroupItemEntities: ReportGroupItemEntity[] = []
    const eventGroupEntities: EventInfoGroupEntity[] = []
    const eventGroupItemEntities: EventInfoGroupItemEntity[] = []

    try {
      // 初始化数据库
      const dataSource = await DataSourceManager.createDeviceDataSource(device.series, dataBasePath)
      await dataSource.synchronize()
      // DTO 转 Entity

      const deviceEntity = new DeviceEntity(device)
      // 符号库原型
      if (R.isNotEmpty(device.symbolArchives)) {
        for (const archive of device.symbolArchives) {
          const archiveEntity = new ProtoSymbolArchiveEntity(archive)
          archiveEntities.push(archiveEntity)

          if (R.isNotEmpty(archive.children)) {
            for (const symbolLib of archive.children) {
              const symbolLibEntity = new ProtoSymbolLibEntity(symbolLib, archiveEntity)
              libEntities.push(symbolLibEntity)
              if (R.isNotEmpty(symbolLib.children)) {
                for (const symbolBlock of symbolLib.children) {
                  const symbolBlockEntity = new ProtoSymbolBlockEntity(symbolBlock, symbolLibEntity)
                  symbolBlockEntities.push(symbolBlockEntity)
                }
              }
            }
          }
        }
      }

      // 机箱板卡模板
      if (R.isNotEmpty(device.modelBoards)) {
        for (const board of device.modelBoards) {
          const boardEntity = new ModelBoardEntity(board)
          boardEntities.push(boardEntity)
        }
      }

      // 硬件配置
      if (device.hardware) {
        hardwareEntity = new HWConfigEntity(device.hardware)
        if (device.hardware.mainBoardConfig) {
          hardwareEntity.mainBoardType = device.hardware.mainBoardConfig.type
          if (R.isNotEmpty(device.hardware.mainBoardConfig.slots)) {
            for (const slot of device.hardware.mainBoardConfig.slots) {
              const slotCfgEntity = new HWSlotConfigEntity(slot, hardwareEntity)
              slotCfgEntities.push(slotCfgEntity)
            }
          }
        }
        if (device.hardware.panelConfig) {
          hardwareEntity.panelType = device.hardware.panelConfig.type
          hardwareEntity.lcdGraph = device.hardware.panelConfig.lcdGraph
          if (R.isNotEmpty(device.hardware.panelConfig.funcKeys)) {
            for (const funcKey of device.hardware.panelConfig.funcKeys) {
              const hwFuncKeysEntity = new HWFuncKeysEntity(funcKey, hardwareEntity)
              funcKeyEntities.push(hwFuncKeysEntity)
            }
          }
          if (R.isNotEmpty(device.hardware.panelConfig.lecConfig)) {
            for (const ledConfigItem of device.hardware.panelConfig.lecConfig) {
              const ledConfigItemEntity = new LEDConfigItemEntity(ledConfigItem, hardwareEntity)
              ledConfigEntities.push(ledConfigItemEntity)
            }
          }
        }
      }
      // 程序配置
      if (device.program) {
        const entities = {
          pageEntities,
          blockInstEntities,
          inputEntities,
          outputEntities,
          paramEntities,
          otherEntities,
          innerEntities,
          labelInEntities,
          labelOutEntities,
          linkDotEntities,
          lineEntities,
          routerPointEntities,
          annotationEntities
        }
        if (device.program.snippet) {
          if (R.isNotEmpty(device.program.snippet.snippets)) {
            for (const snippet of device.program.snippet.snippets) {
              const snippetEntity = new PGSnippetEntity(snippet)
              snippetEntities.push(snippetEntity)
              if (R.isNotEmpty(snippet.pages)) {
                for (const page of snippet.pages) {
                  const pageEntity = new PageEntity(page)
                  pageEntity.snippet = snippetEntity
                  pageEntities.push(pageEntity)
                  this.convertPage(page, pageEntity, entities)
                }
              }
            }
          }
        }
        if (R.isNotEmpty(device.program.optBoards)) {
          for (const board of device.program.optBoards) {
            const boardEntity = new PGOptBoardEntity(board)
            optBoardEntities.push(boardEntity)
            if (R.isNotEmpty(board.cpuCores)) {
              for (const cpuCore of board.cpuCores) {
                const coreEntity = new PGCoreInfoEntity(cpuCore, boardEntity)
                if (R.isNotEmpty(cpuCore.processItems)) {
                  for (const processItem of cpuCore.processItems) {
                    const processEntity = new ProcessItemEntity(processItem, coreEntity)
                    if (R.isNotEmpty(processItem.pages)) {
                      for (const page of processItem.pages) {
                        const pageEntity = new PageEntity(page)
                        pageEntity.processItem = processEntity
                        pageEntities.push(pageEntity)
                        this.convertPage(page, pageEntity, entities)
                      }
                    }
                    processEntities.push(processEntity)
                  }
                }
                if (R.isNotEmpty(cpuCore.pages)) {
                  for (const page of cpuCore.pages) {
                    const pageEntity = new PageEntity(page)
                    pageEntity.core = coreEntity
                    pageEntities.push(pageEntity)
                    this.convertPage(page, pageEntity, entities)
                  }
                }
                coreEntities.push(coreEntity)
              }
            }
          }
        }
      }

      // 装置配置
      if (device.config) {
        if (device.config.macroDefines && R.isNotEmpty(device.config.macroDefines)) {
          for (const macroDefine of device.config.macroDefines) {
            const macroDefineEntity = new MacroDefineEntity(macroDefine)
            macroDefineEntities.push(macroDefineEntity)
          }
        }
        if (device.config.settingGroup) {
          deviceEntity.currentSection = device.config.settingGroup.currentSection
          deviceEntity.sectionNum = device.config.settingGroup.sectionNum

          if (R.isNotEmpty(device.config.settingGroup.settingGroups)) {
            for (const group of device.config.settingGroup.settingGroups) {
              this.convertSettingGroup(group, settingGroupEntities, settingGroupItemEntities, settingGroupItemMergeEntities)
            }
          }
        }
        if (device.config.signalGroup) {
          if (device.config.signalGroup.stateGroup) {
            this.convertGroup(device.config.signalGroup.stateGroup, stateGroupEntities, stateGroupItemEntities, StateGroupEntity, StateGroupItemEntity)
          }
          if (device.config.signalGroup.controlGroup) {
            this.convertGroup(device.config.signalGroup.controlGroup, controlGroupEntities, controlGroupItemEntities, ControlGroupEntity, ControlGroupItemEntity)
          }
          if (device.config.signalGroup.recordGroup) {
            this.convertGroup(device.config.signalGroup.recordGroup, recordGroupEntities, recordGroupItemEntities, RecordGroupEntity, RecordGroupItemEntity)
          }
          if (device.config.signalGroup.reportGroup) {
            this.convertGroup(device.config.signalGroup.reportGroup, reportGroupEntities, reportGroupItemEntities, ReportGroupEntity, ReportGroupItemEntity)
          }
          if (device.config.signalGroup.eventGroup) {
            this.convertGroup(device.config.signalGroup.eventGroup, eventGroupEntities, eventGroupItemEntities, EventInfoGroupEntity, EventInfoGroupItemEntity)
          }
          // TODO custom group
        }
        if (device.config.hmiConfig) {
          if (device.config.hmiConfig.lcdMenu) {
            if (R.isNotEmpty(device.config.hmiConfig.lcdMenu.menus)) {
              for (const menu of device.config.hmiConfig.lcdMenu.menus) {
                this.convertLCDMenu(menu, lcdMenuEntities, lcdRefDataEntities)
              }
            }
          }
          if (device.config.hmiConfig.waveConfig) {
            if (R.isNotEmpty(device.config.hmiConfig.waveConfig.insts)) {
              for (const inst of device.config.hmiConfig.waveConfig.insts) {
                const instEntity = new WaveInstEntity(inst)
                waveInstEntities.push(instEntity)
                if (inst.waveConfig) {
                  const configEntity = new WaveConfigEntity(inst.waveConfig, instEntity)
                  waveConfigEntities.push(configEntity)
                  if (R.isNotEmpty(inst.waveConfig.frequencies)) {
                    for (const freq of inst.waveConfig.frequencies) {
                      const freqEntity = new WaveFrequencyItemEntity(freq, configEntity)
                      waveFreqEntities.push(freqEntity)
                    }
                  }
                }
                if (R.isNotEmpty(inst.waveGroups)) {
                  for (const group of inst.waveGroups) {
                    const groupEntity = new WaveGroupEntity(group, instEntity)
                    waveGroupEntities.push(groupEntity)
                    if (R.isNotEmpty(group.items)) {
                      for (const item of group.items) {
                        const itemEntity = new WaveGroupItemEntity(item, groupEntity)
                        waveGroupItemEntities.push(itemEntity)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      // 写入数据
      await dataSource.transaction(async (entityManager: EntityManager) => {
        await new Dao<DeviceEntity>(DeviceEntity, entityManager).save(deviceEntity)

        await new Dao<ProtoSymbolArchiveEntity>(ProtoSymbolArchiveEntity, entityManager).save(archiveEntities)
        await new Dao<ProtoSymbolLibEntity>(ProtoSymbolLibEntity, entityManager).save(libEntities)
        await new Dao<ProtoSymbolBlockEntity>(ProtoSymbolBlockEntity, entityManager).save(symbolBlockEntities)

        await new Dao<ModelRackEntity>(ModelRackEntity, entityManager).save(rackEntities)
        await new Dao<ModelRackSlotEntity>(ModelRackSlotEntity, entityManager).save(rackSlotEntities)
        await new Dao<ModelBoardEntity>(ModelBoardEntity, entityManager).save(boardEntities)

        await new Dao<HWConfigEntity>(HWConfigEntity, entityManager).save(hardwareEntity)
        await new Dao<HWSlotConfigEntity>(HWSlotConfigEntity, entityManager).save(slotCfgEntities)
        await new Dao<HWFuncKeysEntity>(HWFuncKeysEntity, entityManager).save(funcKeyEntities)
        await new Dao<LEDConfigItemEntity>(LEDConfigItemEntity, entityManager).save(ledConfigEntities)

        await new Dao<PGSnippetEntity>(PGSnippetEntity, entityManager).save(snippetEntities)
        await new Dao<PGOptBoardEntity>(PGOptBoardEntity, entityManager).save(optBoardEntities)
        await new Dao<PGCoreInfoEntity>(PGCoreInfoEntity, entityManager).save(coreEntities)
        await new Dao<ProcessItemEntity>(ProcessItemEntity, entityManager).save(processEntities)

        await new Dao<PageEntity>(PageEntity, entityManager).save(pageEntities)
        await new Dao<LabelInEntity>(LabelInEntity, entityManager).save(labelInEntities)
        await new Dao<LabelOutEntity>(LabelOutEntity, entityManager).save(labelOutEntities)
        await new Dao<LinkDotInstEntity>(LinkDotInstEntity, entityManager).save(linkDotEntities)
        await new Dao<PageAnnotationEntity>(PageAnnotationEntity, entityManager).save(annotationEntities)
        await new Dao<ConnectLineEntity>(ConnectLineEntity, entityManager).save(lineEntities)
        await new Dao<ConnectLineRouterPointsEntity>(ConnectLineRouterPointsEntity, entityManager).save(routerPointEntities)

        await new Dao<SymbolBlockInstEntity>(SymbolBlockInstEntity, entityManager).save(blockInstEntities)
        await new Dao<SymbolBlockVarInputInstEntity>(SymbolBlockVarInputInstEntity, entityManager).save(inputEntities)
        await new Dao<SymbolBlockVarOutputInstEntity>(SymbolBlockVarOutputInstEntity, entityManager).save(outputEntities)
        await new Dao<SymbolBlockVarParamInstEntity>(SymbolBlockVarParamInstEntity, entityManager).save(paramEntities)
        await new Dao<SymbolBlockVarInnerInstEntity>(SymbolBlockVarInnerInstEntity, entityManager).save(innerEntities)
        await new Dao<SymbolBlockVarOtherInstEntity>(SymbolBlockVarOtherInstEntity, entityManager).save(otherEntities)

        await new Dao<MacroDefineEntity>(MacroDefineEntity, entityManager).save(macroDefineEntities)
        await new Dao<SettingGroupEntity>(SettingGroupEntity, entityManager).save(settingGroupEntities)
        await new Dao<SettingGroupItemEntity>(SettingGroupItemEntity, entityManager).save(settingGroupItemEntities)
        await new Dao<SettingGroupItemMergeEntity>(SettingGroupItemMergeEntity, entityManager).save(settingGroupItemMergeEntities)

        await new Dao<StateGroupEntity>(StateGroupEntity, entityManager).save(stateGroupEntities)
        await new Dao<StateGroupItemEntity>(StateGroupItemEntity, entityManager).save(stateGroupItemEntities)
        await new Dao<ControlGroupEntity>(ControlGroupEntity, entityManager).save(controlGroupEntities)
        await new Dao<ControlGroupItemEntity>(ControlGroupItemEntity, entityManager).save(controlGroupItemEntities)
        await new Dao<RecordGroupEntity>(RecordGroupEntity, entityManager).save(recordGroupEntities)
        await new Dao<RecordGroupItemEntity>(RecordGroupItemEntity, entityManager).save(recordGroupItemEntities)
        await new Dao<ReportGroupEntity>(ReportGroupEntity, entityManager).save(reportGroupEntities)
        await new Dao<ReportGroupItemEntity>(ReportGroupItemEntity, entityManager).save(reportGroupItemEntities)
        await new Dao<EventInfoGroupEntity>(EventInfoGroupEntity, entityManager).save(eventGroupEntities)
        await new Dao<EventInfoGroupItemEntity>(EventInfoGroupItemEntity, entityManager).save(eventGroupItemEntities)

        await new Dao<LcdMenuEntity>(LcdMenuEntity, entityManager).save(lcdMenuEntities)
        await new Dao<LcdMenuRefDataEntity>(LcdMenuRefDataEntity, entityManager).save(lcdRefDataEntities)
        await new Dao<WaveInstEntity>(WaveInstEntity, entityManager).save(waveInstEntities)
        await new Dao<WaveConfigEntity>(WaveConfigEntity, entityManager).save(waveConfigEntities)
        await new Dao<WaveFrequencyItemEntity>(WaveFrequencyItemEntity, entityManager).save(waveFreqEntities)
        await new Dao<WaveGroupEntity>(WaveGroupEntity, entityManager).save(waveGroupEntities)
        await new Dao<WaveGroupItemEntity>(WaveGroupItemEntity, entityManager).save(waveGroupItemEntities)
      })
    } catch (e) {
      throw new Error('导入装置失败！数据写库失败' + e)
    } finally {
      await DataSourceManager.closeDataSource(device.series)
    }
  }

  private static convertGroup<T extends { items: any[], childGroups: any[] }, U, V>
  (group: T, entities: U[], itemEntities: V[], ctor: new (props?: any, parent?: any) => U, itemCtor: new(props?: any, parent?: any) => V, parentGroupEntity?: U) {
    const groupEntity = new ctor(group, parentGroupEntity)
    entities.push(groupEntity)
    if (R.isNotEmpty(group.items)) {
      for (const item of group.items) {
        const itemEntity = new itemCtor(item, groupEntity)
        itemEntities.push(itemEntity)
      }
    }
    if (R.isNotEmpty(group.childGroups)) {
      for (const subgroup of group.childGroups) {
        this.convertGroup(subgroup, entities, itemEntities, ctor, itemCtor, groupEntity)
      }
    }
  }

  private static convertSettingGroup (group: SettingGroup, settingGroupEntities: SettingGroupEntity[], settingGroupItemEntities: SettingGroupItemEntity[], settingGroupItemMergeEntities: SettingGroupItemMergeEntity[], parentGroupEntity?: SettingGroupEntity) {
    const groupEntity = new SettingGroupEntity(group, parentGroupEntity)
    settingGroupEntities.push(groupEntity)
    if (R.isNotEmpty(group.items)) {
      for (const item of group.items) {
        const itemEntity = new SettingGroupItemEntity(item, groupEntity)
        settingGroupItemEntities.push(itemEntity)
        if (R.isNotEmpty(item.merges)) {
          for (const merge of item.merges) {
            const mergeEntity = new SettingGroupItemMergeEntity(merge, itemEntity)
            settingGroupItemMergeEntities.push(mergeEntity)
          }
        }
      }
    }
    if (R.isNotEmpty(group.childGroups)) {
      for (const subgroup of group.childGroups) {
        this.convertSettingGroup(subgroup, settingGroupEntities, settingGroupItemEntities, settingGroupItemMergeEntities, groupEntity)
      }
    }
  }

  private static convertLCDMenu (menu: LcdMenu, lcdMenuEntities: LcdMenuEntity[], lcdRefDataEntities: LcdMenuRefDataEntity[], parentMenu?: LcdMenuEntity) {
    const menuEntity = new LcdMenuEntity(menu, parentMenu)
    lcdMenuEntities.push(menuEntity)
    if (R.isNotEmpty(menu.refDatas)) {
      for (const refData of menu.refDatas) {
        const refDataEntity = new LcdMenuRefDataEntity(refData, menuEntity)
        lcdRefDataEntities.push(refDataEntity)
      }
    }
    if (R.isNotEmpty(menu.menus)) {
      for (const subMenu of menu.menus) {
        this.convertLCDMenu(subMenu, lcdMenuEntities, lcdRefDataEntities, menuEntity)
      }
    }
  }

  private static convertPage (page: Page, pageEntity: PageEntity, entities: {
    pageEntities: PageEntity[],
    blockInstEntities: SymbolBlockInstEntity[],
    inputEntities: SymbolBlockVarInputInstEntity[],
    outputEntities: SymbolBlockVarOutputInstEntity[],
    paramEntities: SymbolBlockVarParamInstEntity[],
    innerEntities: SymbolBlockVarInnerInstEntity[],
    otherEntities: SymbolBlockVarOtherInstEntity[],
    labelInEntities: LabelInEntity[],
    labelOutEntities: LabelOutEntity[],
    linkDotEntities: LinkDotInstEntity[],
    lineEntities: ConnectLineEntity[],
    routerPointEntities: ConnectLineRouterPointsEntity[],
    annotationEntities: PageAnnotationEntity[]
  }) {
    const {
      pageEntities, blockInstEntities, inputEntities, outputEntities, paramEntities, innerEntities, otherEntities,
      labelInEntities, labelOutEntities, linkDotEntities, lineEntities, routerPointEntities, annotationEntities
    } = entities
    if (R.isNotEmpty(page.symbolBlocks)) {
      for (const block of page.symbolBlocks) {
        const blockEntity = new SymbolBlockInstEntity(block, pageEntity)
        blockInstEntities.push(blockEntity)
        // 输入
        if (R.isNotEmpty(block.inputs)) {
          for (const item of block.inputs) {
            inputEntities.push(new SymbolBlockVarInputInstEntity(item, blockEntity))
          }
        }
        // 输出
        if (R.isNotEmpty(block.outputs)) {
          for (const item of block.outputs) {
            outputEntities.push(new SymbolBlockVarOutputInstEntity(item, blockEntity))
          }
        }
        // 参数
        if (R.isNotEmpty(block.params)) {
          for (const item of block.params) {
            paramEntities.push(new SymbolBlockVarParamInstEntity(item, blockEntity))
          }
        }
        // 内参
        if (R.isNotEmpty(block.inners)) {
          for (const item of block.inners) {
            innerEntities.push(new SymbolBlockVarInnerInstEntity(item, blockEntity))
          }
        }
        // 其他
        if (R.isNotEmpty(block.others)) {
          for (const item of block.others) {
            otherEntities.push(new SymbolBlockVarOtherInstEntity(item, blockEntity))
          }
        }
      }
    }
    if (R.isNotEmpty(page.inLabels)) {
      for (const label of page.inLabels) {
        labelInEntities.push(new LabelInEntity(label, pageEntity))
      }
    }
    if (R.isNotEmpty(page.outLabels)) {
      for (const label of page.outLabels) {
        labelOutEntities.push(new LabelOutEntity(label, pageEntity))
      }
    }
    if (R.isNotEmpty(page.linkDots)) {
      for (const item of page.linkDots) {
        linkDotEntities.push(new LinkDotInstEntity(item, pageEntity))
      }
    }
    if (R.isNotEmpty(page.connectLines)) {
      for (const line of page.connectLines) {
        const lineEntity = new ConnectLineEntity(line, pageEntity)
        lineEntities.push(lineEntity)
        if (R.isNotEmpty(line.routerPoints)) {
          for (const point of line.routerPoints) {
            routerPointEntities.push(new ConnectLineRouterPointsEntity(point, lineEntity))
          }
        }
      }
    }
    if (R.isNotEmpty(page.annotations)) {
      for (const item of page.annotations) {
        annotationEntities.push(new PageAnnotationEntity(item, pageEntity))
      }
    }
    if (R.isNotEmpty(page.pages)) {
      for (const subPage of page.pages) {
        const subPageEntity = new PageEntity(subPage)
        subPageEntity.parentPage = pageEntity
        pageEntities.push(subPageEntity)
        this.convertPage(subPage, subPageEntity, entities)
      }
    }
  }
}
