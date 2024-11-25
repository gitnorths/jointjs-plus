import { ReportGroupItem, SignalGroupConfig } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'
import { TreeNode } from '@/model/dto/TreeNode'

export class ReportGroup extends TreeNode<SignalGroupConfig | ReportGroup, ReportGroup> {
  id!: string
  name!: 'REPORT_TABLE' | 'FAULT_TABLE' | 'TRIP_TABLE' | 'SOE_TABLE' | 'CHG_TABLE' | 'CHECK_TABLE' | 'RUN_TABLE' | 'CUSTOM_TABLE' | string
  desc!: '报告类' | '整组报告' | '动作报告' | 'SOE报告' | '变位报告' | '自检报告' | '运行报告' | '自定义报告' | string
  reserved!: YesNoEnum
  isFolder!: YesNoEnum
  index!: number // 排序
  maxRecordNum!: number // 0 - 1024 256
  attrFilter!: string[]
  childGroups!: ReportGroup[]
  items!: ReportGroupItem[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.reserved = props.reserved
      this.isFolder = props.isFolder
      this.index = props.index
      this.maxRecordNum = props.maxRecordNum
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
