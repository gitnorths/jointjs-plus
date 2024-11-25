import { TreeNode } from '@/model/dto/TreeNode'
import { FuncKeysConfig, HardwareConfig, LEDConfigItem } from '@/model/dto'

export class PanelConfig extends TreeNode<HardwareConfig, any> {
  id = 'PanelConfig'
  type!: string // 板卡型号
  sn!: string // MOT编码
  desc!: string // 描述
  optTypeList!: string[] // 可选板卡列表
  lcdGraph!: string // 液晶菜单主画面
  funcKeys!: FuncKeysConfig[] // 功能按键配置
  lecConfig!: LEDConfigItem[] // LED配置

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.type = props.type
      this.sn = props.sn
      this.desc = props.desc
      this.optTypeList = props.optTypeList
      this.lcdGraph = props.lcdGraph
    }
    this.funcKeys = []
    this.lecConfig = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '面板配置' // FIXME i18n
  }

  initChildren () {
    // no need to do
  }
}
