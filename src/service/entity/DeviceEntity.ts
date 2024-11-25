import { Column, Entity, PrimaryColumn } from 'typeorm'
import { HWConfigEntity } from './hardware/HWConfigEntity'
import { SettingGroupEntity } from './settingGroup/SettingGroupEntity'
import { StateGroupEntity } from './signalGroup/stateGroup/StateGroupEntity'
import { EventInfoGroupEntity } from './signalGroup/eventInfoGroup/EventInfoGroupEntity'
import { ControlGroupEntity } from './signalGroup/controlGroup/ControlGroupEntity'
import { RecordGroupEntity } from './signalGroup/recordGroup/RecordGroupEntity'
import { CustomGroupEntity } from './signalGroup/customGroup/CustomGroupEntity'
import { ReportGroupEntity } from './signalGroup/reportGroup/ReportGroupEntity'
import { WaveInstEntity } from './hmiConfig/waveConfig/WaveInstEntity'
import { SCLEntity } from './communication/iec61850/SCLEntity'
import { MacroDefineEntity } from './deviceConfig/MacroDefineEntity'
import { LcdMenuEntity } from './hmiConfig/lcdMenu/LcdMenuEntity'
import { ProtoSymbolArchiveEntity } from './program/symbolProto/ProtoSymbolArchiveEntity'
import { PGOptBoardEntity } from './program/PGOptBoardEntity'
import { PGSnippetEntity } from './program/PGSnippetEntity'

/**
 * 装置系列实体.
 * @param {string} toolVersion - 工具版本
 * @param {string} series - 装置系列，数据库主键
 * @param {string} model - 装置型号（场景）
 * @param {string} version - 装置版本
 * @param {HWConfigEntity} hardwareConfig - 硬件配置
 * @param {SettingGroupEntity} settingGroup - 定值分组配置
 * @param {ControlGroupEntity} ctrl - 控制分组配置
 * @param {Array<LcdMenuEntity>>} lcd - 液晶菜单
 * @param {SCLEntity} iec61850 - 61850配置
 * @constructor
 */
@Entity('device')
export class DeviceEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  toolVersion!: string

  @Column()
  series!: string

  @Column()
  version!: string // 版本助记符

  @Column({ nullable: true })
  platformVersion!: string

  @Column({ nullable: true })
  currentSection!: number // 当前定值区

  @Column({ nullable: true })
  sectionNum!: number // 定值最大组号 32

  @Column({ nullable: true, type: 'text' })
  tpl!: string

  // 硬件配置
  hardwareConfig!: HWConfigEntity
  // 程序配置
  snippets!: PGSnippetEntity[]
  optBoards!: PGOptBoardEntity[]
  // 信号分组
  stateGroup!: StateGroupEntity // 状态量
  controlGroup!: ControlGroupEntity // 控制类
  recordGroup!: RecordGroupEntity // 记录类
  reportGroup!: ReportGroupEntity // 报告
  eventInfoGroup!: EventInfoGroupEntity // 事件信息表
  customGroup!: CustomGroupEntity // 自定义
  // 定值分组
  settingGroup!: SettingGroupEntity
  // HMI配置
  lcd!: LcdMenuEntity[] // 液晶菜单
  waveConfig!: WaveInstEntity[] // 录波实例

  iec61850!: SCLEntity

  macroDefine!: MacroDefineEntity[]
  symbolArchives!: ProtoSymbolArchiveEntity[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.toolVersion = props.toolVersion
      this.series = props.series
      this.version = props.version
      this.platformVersion = props.platformVersion
      this.currentSection = props.currentSection
      this.sectionNum = props.sectionNum
      this.tpl = props.tpl
    }
  }
}
