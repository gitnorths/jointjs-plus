import { VariableTypeEnum } from '@/model/enum'

export class SymbolBlockVarOther {
  pathId!: string
  name!: string // 成员变量名
  index!: number
  type!: VariableTypeEnum // 变量类型
  optTypeList!: VariableTypeEnum[] // 可变类型列表
  default!: string // 缺省值

  constructor (props?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.index = props.index
      this.type = props.type
      this.optTypeList = props.optTypeList
      this.default = props.default
    } else {
      this.optTypeList = []
    }
  }
}
