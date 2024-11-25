import * as R from 'ramda'
import { TreeNode } from '@/model/dto/TreeNode'
import { VarTreeInput, VarTreeOutput, VarTreePage, VarTreeParam } from '@/model/dto'

/**
 * 变量库符号类.
 * @constructor
 */
export class VarTreeSymbol extends TreeNode<VarTreePage, VarTreeInput | VarTreeOutput | VarTreeParam> {
  id: string
  name: string
  instName: string
  orderInPage: number
  desc: string
  sAddr: string
  noChildren: boolean // true表示控制分组
  inputs: VarTreeInput[]
  outputs: VarTreeOutput[]
  params: VarTreeParam[]

  constructor (symbolBlock: any, parent?: VarTreePage) {
    super()
    this.id = symbolBlock.id
    this.name = symbolBlock.name
    this.instName = symbolBlock.instName
    this.orderInPage = symbolBlock.orderInPage
    this.desc = symbolBlock.desc
    this.sAddr = symbolBlock.sAddr
    this.noChildren = symbolBlock.noChildren

    this.inputs = []
    this.outputs = []
    this.params = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = this.desc
      ? `${this.instName || this.name} : ${this.desc}`
      : this.instName || this.name
  }

  initChildren () {
    this.children = []
    if (R.isNotEmpty(this.inputs)) {
      this.children = this.inputs
    }
    if (R.isNotEmpty(this.outputs)) {
      this.children = this.outputs
    }
    if (R.isNotEmpty(this.params)) {
      this.children = this.params
    }
  }
}
