import * as R from 'ramda'
import { TreeNode } from '@/model/dto/TreeNode'
import { VarTreeBoard } from '@/model/dto'

/**
 * 变量库配置类.
 * @constructor
 */
export class VarTreeConfig extends TreeNode<null, VarTreeBoard> {
  id?: string
  name?: string
  boards: VarTreeBoard[]

  constructor (device: any) {
    super()
    this.id = device.name
    this.name = device.name
    this.boards = []
    this.setTitle()
  }

  setTitle () {
    this.title = this.name
  }

  initChildren () {
    this.children = this.boards.filter((treeNode) => {
      return treeNode.children && R.isNotEmpty(treeNode.children)
    })
  }
}
