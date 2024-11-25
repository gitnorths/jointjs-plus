import { TreeNode } from '@/model/dto/TreeNode'
import { HardwareConfig, MainBoardSlotConfig } from '@/model/dto'

export class MainBoardConfig extends TreeNode<HardwareConfig, any> {
  id = 'MainBoardConfig'
  type!: string
  slots!: MainBoardSlotConfig[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.type = props.type
    }
    this.slots = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '背板配置' // FIXME i18n
  }

  initChildren () {
    // no need to do
  }
}
