import { SignalGroupConfig, StateGroupItem } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'
import { TreeNode } from '@/model/dto/TreeNode'

export class StateGroup extends TreeNode<SignalGroupConfig | StateGroup, StateGroup> {
  id!: string
  name!: 'STATE_TABLE' | 'YX_TABLE' | 'YC_TABLE' | 'MEA_TABLE' | string
  desc!: '状态量' | '遥信' | '遥测' | '测量' | string
  reserved!: YesNoEnum
  isFolder!: YesNoEnum
  index!: number // 排序
  attrFilter!: string[]

  childGroups!: StateGroup[]
  items!: StateGroupItem[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.reserved = props.reserved
      this.isFolder = props.isFolder
      this.index = props.index
      this.attrFilter = props.attrFilter
    } else {
      this.attrFilter = []
    }
    this.childGroups = []
    this.items = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `${this.desc} ${this.name}`
  }

  initChildren () {
    this.children = this.childGroups
  }
}
