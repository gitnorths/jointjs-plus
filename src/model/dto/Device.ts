import { TreeNode } from '@/model/dto/TreeNode'
import { DeviceConfig, HardwareConfig, ModelBoard, ProgramConfig, ProtoSymbolArchive } from '@/model/dto'

/**
 * 装置系列实体.
 * @param {string} toolVersion - 工具版本
 * @param {string} series - 装置系列，数据库主键
 * @param {string} model - 装置型号（场景）
 * @param {string} version - 装置版本
 * @constructor
 */
export class Device extends TreeNode<any, any> {
  id!: string
  toolVersion!: string
  series!: string
  version!: string // FIXME 版本助记符
  platformVersion!: string

  // 硬件
  hardware!: HardwareConfig
  // 程序
  program!: ProgramConfig
  // 配置
  config!: DeviceConfig
  // 使用的符号仓
  symbolArchives!: ProtoSymbolArchive[]
  // 板卡模板
  modelBoards!: ModelBoard[]

  constructor (props?: any) {
    super()
    if (props) {
      this.id = props.id
      this.toolVersion = props.toolVersion
      this.series = props.series
      this.version = props.version
      this.platformVersion = props.platformVersion
    }
    this.symbolArchives = []
    this.modelBoards = []
    this.setTitle()
  }

  setTitle () {
    this.title = this.series
  }

  initChildren () {
    this.children = []
    this.children.push(this.hardware, this.program, this.config)
  }
}
