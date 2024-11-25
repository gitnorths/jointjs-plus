import { TreeNode } from '@/model/dto/TreeNode'
import { CpuCoreInfo, Page } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'

export class ProcessItem extends TreeNode<CpuCoreInfo, Page> {
  id!: string
  name!: string
  inst!: string
  args!: string
  enable!: YesNoEnum
  index!: number
  pages!: Page[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.inst = props.inst
      this.args = props.args
      this.enable = props.enable
      this.index = props.index
    }
    this.pages = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `${this.name || this.inst}`
  }

  initChildren () {
    this.children = this.pages
  }
}
