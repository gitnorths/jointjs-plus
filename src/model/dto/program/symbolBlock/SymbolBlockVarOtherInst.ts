import { VariableTypeEnum } from '@/model/enum'

export class SymbolBlockVarOtherInst {
  id!: string
  name!: string // 成员变量名
  regName!: string // 注册变量名
  pathId!: string
  searchPath!: string
  sAddr!: string
  index!: number
  type!: VariableTypeEnum // 变量类型'
  default!: string // 缺省值
  symbolBlockId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.regName = props.regName
      this.pathId = props.pathId
      this.searchPath = props.searchPath
      this.sAddr = props.sAddr
      this.index = props.index
      this.type = props.type
      this.default = props.default
      this.symbolBlockId = props.symbolBlockId
    }
  }
}
