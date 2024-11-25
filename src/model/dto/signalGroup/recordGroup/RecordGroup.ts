import { RecordGroupItem, SignalGroupConfig } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'
import { TreeNode } from '@/model/dto/TreeNode'

export class RecordGroup extends TreeNode<SignalGroupConfig | RecordGroup, RecordGroup> {
  id!: string
  name!: 'RECORD_TABLE' | 'ACC_TABLE' | 'ADJUST_TABLE' | string
  desc!: '纪录类' | '累计量' | '校准通道' | string
  reserved!: YesNoEnum
  isFolder!: YesNoEnum
  index!: number // 排序

  childGroups!: RecordGroup[]
  items!: RecordGroupItem[]

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
