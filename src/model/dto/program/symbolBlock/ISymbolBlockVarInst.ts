import { TaskLevelEnum, VariableTypeEnum } from '@/model/enum'

export abstract class ISymbolBlockVarInst {
  id!: string
  name!: string
  regName!: string
  pathId!: string
  searchPath!: string
  desc!: string
  customDesc!: string
  index!: number
  type!: VariableTypeEnum // 变量类型
  structType!: string
  customType!: VariableTypeEnum // 变量类型
  regType!: string // 注册类型
  level!: TaskLevelEnum // 对外交互等级
  customLevel!: TaskLevelEnum // 对外交互等级
  default!: string // 缺省值
  format!: string // 格式
  coeff!: string // 系数
  unit!: string // 单位
  abbr!: string // 缩略语
  showAttr!: string // 显示属性
  pNorm!: string // 一次额定值
  pMin!: string // 一次最小值
  pMax!: string // 一次最大值
  sNorm!: string // 二次额定值
  sMin!: string // 二次最小值
  sMax!: string // 二次最大值
  status!: number
  sAddr!: string
  symbolBlockId!: string

  protected constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.regName = props.regName
      this.pathId = props.pathId
      this.searchPath = props.searchPath
      this.desc = props.desc
      this.customDesc = props.customDesc
      this.index = props.index
      this.type = props.type
      this.structType = props.structType
      this.customType = props.customType
      this.regType = props.regType
      this.level = props.level
      this.customLevel = props.customLevel
      this.default = props.default
      this.format = props.format
      this.coeff = props.coeff
      this.unit = props.unit
      this.abbr = props.abbr
      this.showAttr = props.showAttr
      this.pNorm = props.pNorm
      this.pMin = props.pMin
      this.pMax = props.pMax
      this.sNorm = props.sNorm
      this.sMin = props.sMin
      this.sMax = props.sMax
      this.status = props.status
      this.sAddr = props.sAddr
      this.symbolBlockId = props.symbolBlockId
    }
  }
}
