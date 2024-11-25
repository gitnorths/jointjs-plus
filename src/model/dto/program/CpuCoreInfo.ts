import { TreeNode } from '@/model/dto/TreeNode'
import { Page, ProcessItem, ProgramBoard } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'
import * as R from 'ramda'

/**
 * CPU核
 * @param {string} id - 数据库id
 * @param {string} name - 核名称
 * @param {number} cpuIndex - CPU编号
 * @param {number} coreIndex - 核编号
 * @param {number} mainCpu - 是否是主CPU
 * @param {number} mainDsp - 是否是主DSP
 * @constructor
 */
export class CpuCoreInfo extends TreeNode<ProgramBoard, ProcessItem | Page> {
  id!: string
  name!: string
  cpuIndex!: number
  coreIndex!: number
  mainCpu!: YesNoEnum
  mainDsp!: YesNoEnum
  processItems!: ProcessItem[]
  pages!: Page[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.cpuIndex = props.cpuIndex
      this.coreIndex = props.coreIndex
      this.mainCpu = props.mainCpu
      this.mainDsp = props.mainDsp
    }
    this.processItems = []
    this.pages = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `P${this.cpuIndex}C${this.coreIndex}`
  }

  initChildren () {
    this.children = []
    if (R.isNotEmpty(this.processItems)) {
      this.children = this.processItems
    }
    if (R.isNotEmpty(this.pages)) {
      this.children = this.pages
    }
  }
}
