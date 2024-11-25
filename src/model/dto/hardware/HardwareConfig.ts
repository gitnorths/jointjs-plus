import { TreeNode } from '@/model/dto/TreeNode'
import { Device, MainBoardConfig, PanelConfig } from '@/model/dto'

// 硬件配置（机箱型号配置）
export class HardwareConfig extends TreeNode<Device, MainBoardConfig | PanelConfig> {
  id = 'HardwareConfig'
  rackType!: string // 机箱型号决定了母板和面板型号
  rackSize!: 'whole' | '1/2' | '1/3'
  rackUnit!: '1U' | '2U' | '4U' | '8U'
  desc!: string // 描述
  height!: number
  width!: number
  depth!: number
  insertType!: 'vertical' | 'horizontal' // 板卡插接方式

  mainBoardConfig!: MainBoardConfig
  panelConfig!: PanelConfig

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.desc = props.desc
      this.rackType = props.rackType
      this.rackSize = props.rackSize
      this.rackUnit = props.rackUnit
      this.height = props.height
      this.width = props.width
      this.depth = props.depth
      this.insertType = props.insertType
    }
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '硬件'
  }

  initChildren () {
    this.children = []
    this.children.push(this.mainBoardConfig)
    this.children.push(this.panelConfig)
  }
}
