import { TreeNode } from '@/model/dto/TreeNode'
import { VarTreeCore, VarTreePage } from '@/model/dto'
import * as R from 'ramda'

/**
 * 变量库进程类.
 * @constructor
 */
export class VarTreeProcess extends TreeNode<VarTreeCore, VarTreePage> {
  id: string
  name: string
  inst: string
  index: number
  pages: VarTreePage[]

  constructor (proc: any, parent?: VarTreeCore) {
    super()
    this.id = proc.id
    this.name = proc.name
    this.inst = proc.inst
    this.index = proc.index
    this.pages = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `${this.name || this.inst}`
  }

  initChildren () {
    this.children = this.pages.filter((treeNode) => {
      return treeNode.children && R.isNotEmpty(treeNode.children)
    })
  }
}
