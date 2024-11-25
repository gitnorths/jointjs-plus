import { TreeNode } from '@/model/dto/TreeNode'
import { ControlGroupItem, SignalGroupConfig } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'

export class ControlGroup extends TreeNode<SignalGroupConfig | ControlGroup, ControlGroup> {
  id!: string
  name!: 'CTRL_TABLE' | 'YK_TABLE' | 'YT_TABLE' | 'YM_TABLE' | 'DRIVE_TABLE' | string
  desc!: '控制类' | '遥控' | '遥调' | '遥脉' | '开出传动' | string
  reserved!: YesNoEnum
  isFolder!: YesNoEnum
  index!: number // 排序
  childGroups!: ControlGroup[]
  items!: ControlGroupItem[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.reserved = props.reserved
      this.isFolder = props.isFolder
      this.index = props.index
    }
    this.parent = parent
    this.childGroups = []
    this.items = []
    this.setTitle()
  }

  setTitle () {
    this.title = `${this.desc} ${this.name}`
  }

  initChildren () {
    this.children = this.childGroups
  }
}
