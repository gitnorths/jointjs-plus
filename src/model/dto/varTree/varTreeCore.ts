import * as R from 'ramda'
import { TreeNode } from '@/model/dto/TreeNode'
import { VarTreeBoard, VarTreePage, VarTreeProcess } from '@/model/dto'

/**
 * 变量库CPU核类.
 * @constructor
 */
export class VarTreeCore extends TreeNode<VarTreeBoard, VarTreeProcess | VarTreePage> {
  id: string
  cpuIndex: number
  coreIndex: number
  processes!: VarTreeProcess[]
  pages!: VarTreePage[]

  constructor (proc: any, parent?: VarTreeBoard) {
    super()
    this.id = proc.id
    this.cpuIndex = proc.cpuIndex
    this.coreIndex = proc.coreIndex
    this.processes = []
    this.pages = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `P${this.cpuIndex}C${this.coreIndex}`
  }

  initChildren () {
    this.children = []
    if (R.isNotEmpty(this.processes)) {
      this.children = this.processes.filter((treeNode) => {
        return treeNode.children && R.isNotEmpty(treeNode.children)
      })
    }
    if (R.isNotEmpty(this.pages)) {
      this.children = this.pages.filter((treeNode) => {
        return treeNode.children && R.isNotEmpty(treeNode.children)
      })
    }
  }
}
