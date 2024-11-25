import { TreeNode } from '@/model/dto/TreeNode'
import { VarTreeCore, VarTreeParam, VarTreeProcess, VarTreeSymbol } from '@/model/dto'
import * as R from 'ramda'
import { YesNoEnum } from '@/model/enum'

/**
 * 变量库页面类.
 * @constructor
 */
export class VarTreePage extends TreeNode<VarTreeCore | VarTreeProcess | VarTreePage, VarTreePage | VarTreeSymbol | VarTreeParam> {
  id: string
  name: string
  isFolder: YesNoEnum
  index: number
  pages: VarTreePage[]
  symbols: VarTreeSymbol[]
  customs: VarTreeParam[]

  constructor (page: any, parent?: any) {
    super()
    this.id = page.id
    this.name = page.name
    this.isFolder = page.isFolder
    this.index = page.index
    this.pages = []
    this.symbols = []
    this.customs = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = this.name
  }

  initChildren () {
    if (R.isNotEmpty(this.pages)) {
      this.children = this.pages.filter((treeNode) => {
        return treeNode.children && R.isNotEmpty(treeNode.children)
      })
    }
    if (R.isNotEmpty(this.customs)) {
      this.children = this.customs
    }
    if (R.isNotEmpty(this.symbols)) {
      this.children = this.symbols.filter((treeNode) => {
        // 判断是不是控制分组
        if (treeNode.noChildren) {
          return true
        }
        return treeNode.children && R.isNotEmpty(treeNode.children)
      })
    }
  }
}
