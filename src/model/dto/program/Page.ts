import { TreeNode } from '@/model/dto/TreeNode'
import { EnableStatusEnum, TaskLevelEnum, YesNoEnum } from '@/model/enum'
import {
  ConnectLine,
  CpuCoreInfo,
  LabelIn,
  LabelOut,
  LinkDotInst,
  PageAnnotation,
  ProcessItem,
  SymbolBlockInst
} from '@/model/dto'
import * as R from 'ramda'

export class Page extends TreeNode<CpuCoreInfo | ProcessItem | Page, Page> {
  id!: string
  name!: string
  isFolder!: YesNoEnum
  isSnippet!: YesNoEnum
  searchPath!: string
  index!: number
  pageSize!: 'A3' | 'A4'
  level!: TaskLevelEnum
  status!: EnableStatusEnum
  permissions!: string[]

  symbolBlocks!: SymbolBlockInst[]
  connectLines!: ConnectLine[]
  linkDots!: LinkDotInst[]
  annotations!: PageAnnotation[]
  inLabels!: LabelIn[]
  outLabels!: LabelOut[]

  pages!: Page[]
  pageSymbolPathId!: string // 一个页面组有一个符号

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.isFolder = props.isFolder
      this.isSnippet = props.isSnippet
      this.searchPath = props.searchPath
      this.index = props.index
      this.pageSize = props.pageSize
      this.level = props.level
      this.status = props.status
      this.permissions = props.permissions
      this.pageSymbolPathId = props.pageSymbolPathId
    } else {
      this.permissions = []
    }
    this.symbolBlocks = []
    this.connectLines = []
    this.linkDots = []
    this.annotations = []
    this.inLabels = []
    this.outLabels = []
    this.pages = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `${this.name}`
  }

  initChildren () {
    if (R.isNotEmpty(this.pages)) {
      this.children = this.pages
    }
  }
}
