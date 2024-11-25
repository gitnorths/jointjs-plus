import { TaskLevelEnum, VariableTypeEnum } from '@/model/enum'

export abstract class SymbolBlockVar {
  pathId!: string // 路径id
  name!: string // 成员变量名
  regName!: string // 注册变量名
  index!: number
  desc!: string // 描述
  type!: VariableTypeEnum // 变量类型
  optTypeList!: VariableTypeEnum[] // 可变类型列表
  structType!: string
  regType!: string // 注册类型
  level!: TaskLevelEnum // 对外交互等级
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

  protected constructor (props?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.regName = props.regName
      this.index = props.index
      this.desc = props.desc
      this.type = props.type
      this.optTypeList = props.optTypeList
      this.structType = props.structType
      this.regType = props.regType
      this.level = props.level
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
    } else {
      this.optTypeList = []
    }
  }
}
