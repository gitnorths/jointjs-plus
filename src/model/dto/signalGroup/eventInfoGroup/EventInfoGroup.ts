import { EventInfoGroupItem, SignalGroupConfig } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'
import { TreeNode } from '@/model/dto/TreeNode'

export class EventInfoGroup extends TreeNode<SignalGroupConfig | EventInfoGroup, EventInfoGroup> {
  id!: string
  name!: 'EVENT_INFO_TABLE' | 'TRIP_PARA_TABLE' | string
  desc!: '事件信息表' | '动作报告信息' | string
  reserved!: YesNoEnum
  isFolder!: YesNoEnum
  index!: number // 排序
  childGroups!: EventInfoGroup[]
  items!: EventInfoGroupItem[]

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
