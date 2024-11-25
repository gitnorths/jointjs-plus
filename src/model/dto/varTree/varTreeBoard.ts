import { TreeNode } from '@/model/dto/TreeNode'
import { format10 } from '@/util'
import { VarTreeConfig, VarTreeCore } from '@/model/dto'
import * as R from 'ramda'

/**
 * 变量库板卡类.
 * @constructor
 */
export class VarTreeBoard extends TreeNode<VarTreeConfig, VarTreeCore> {
  id: string
  slot: number
  type: string
  cores: VarTreeCore[]

  constructor (proc: any, parent?: VarTreeConfig) {
    super()
    this.id = proc.id
    this.slot = proc.slot
    this.type = proc.type
    this.cores = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `[B${format10(this.slot)}] ${this.type}`
  }

  initChildren () {
    this.children = this.cores.filter((treeNode) => {
      return treeNode.children && R.isNotEmpty(treeNode.children)
    })
  }
}
