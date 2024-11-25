import { CustomGroupItem, SignalGroupConfig } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'
import { TreeNode } from '@/model/dto/TreeNode'

export class CustomGroup extends TreeNode<SignalGroupConfig | CustomGroup, CustomGroup> {
  id!: string
  name!: string
  desc!: string
  reserved!: YesNoEnum
  isFolder!: YesNoEnum
  index!: number // 排序

  childGroups!: CustomGroup[]
  items!: CustomGroupItem[]

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
