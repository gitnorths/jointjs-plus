import { TreeNode } from '@/model/dto/TreeNode'
import { VariableTypeEnum } from '@/model/enum'
import { VarTreeSymbol } from '@/model/dto'

/**
 * 输入变量类.
 * @constructor
 */
export class VarTreeInput extends TreeNode<VarTreeSymbol, any> {
  id: string
  name: string
  regName!: string
  sAddr: string
  desc: string
  index: number
  type: VariableTypeEnum

  constructor (input: any, parent?: VarTreeSymbol) {
    super()
    this.id = input.id
    this.name = input.name
    this.regName = input.regName
    this.sAddr = input.sAddr
    this.desc = input.customDesc || input.desc // 使用自定义描述
    this.index = input.index
    this.type = input.customType || input.type // 使用自定义类型
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    // 使用描述 + 短地址的方式
    this.title = this.desc ? `${this.desc} : ${this.regName || this.name}` : this.regName || this.name
  }

  initChildren () {
    // no need
  }
}
