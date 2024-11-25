import { VariableTypeEnum } from '@/model/enum'

export class SymbolBlockVarInner {
  pathId!: string
  name!: string // 成员变量名
  index!: number
  type!: VariableTypeEnum // 变量类型
  optTypeList!: VariableTypeEnum[] // 可变类型列表
  default!: string // 缺省值
  value!: string // 设置值

  constructor (props?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.index = props.index
      this.type = props.type
      this.optTypeList = props.optTypeList
      this.default = props.default
      this.value = props.value
    } else {
      this.optTypeList = []
    }
  }
}
