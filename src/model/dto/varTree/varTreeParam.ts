import { TreeNode } from '@/model/dto/TreeNode'
import { VariableTypeEnum } from '@/model/enum'
import { VarTreePage, VarTreeSymbol } from '@/model/dto'

/**
 * 输入变量类.
 * @constructor
 */
export class VarTreeParam extends TreeNode<VarTreeSymbol | VarTreePage, any> {
  id: string
  name: string
  regName!: string
  sAddr: string
  desc: string
  index: number
  type: VariableTypeEnum
  format: string
  abbr: string
  pMin: string
  pMax: string
  pNorm: string
  sMin: string
  sMax: string
  sNorm: string

  constructor (input: any, parent?: VarTreeSymbol | VarTreePage) {
    super()
    this.id = input.id
    this.name = input.name
    this.regName = input.regName
    this.sAddr = input.sAddr
    this.desc = input.customDesc || input.desc // 使用自定义描述
    this.index = input.index
    this.type = input.customType || input.type // 使用自定义类型
    this.format = input.format
    this.abbr = input.abbr
    this.pMin = input.pMin
    this.pMax = input.pMax
    this.pNorm = input.pNorm
    this.sMin = input.sMin
    this.sMax = input.sMax
    this.sNorm = input.sNorm
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
