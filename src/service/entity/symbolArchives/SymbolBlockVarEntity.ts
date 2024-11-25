import { Column, PrimaryColumn } from 'typeorm'
import { TaskLevelEnum, VariableTypeEnum } from '@/model/enum'

export abstract class SymbolBlockVarEntity {
  @PrimaryColumn()
  pathId!: string // 路径id

  @Column()
  name!: string // 成员变量名

  @Column({ nullable: true })
  regName!: string // 注册变量名

  @Column()
  index!: number

  @Column({ nullable: true })
  desc!: string // 描述

  @Column({ type: 'numeric' })
  type!: VariableTypeEnum // 变量类型

  @Column({ nullable: true, type: 'simple-array' })
  optTypeList!: VariableTypeEnum[] // 输出可变类型列表

  @Column({ nullable: true })
  structType!: string

  @Column({ nullable: true })
  regType!: string // 注册类型

  @Column({ type: 'numeric' })
  level!: TaskLevelEnum // 对外交互等级

  @Column({ nullable: true })
  default!: string // 缺省值

  @Column({ nullable: true })
  format!: string // 格式

  @Column({ nullable: true })
  coeff!: string // 系数

  @Column({ nullable: true })
  unit!: string // 单位

  @Column({ nullable: true })
  abbr!: string // 缩略语

  @Column({ nullable: true })
  showAttr!: string // 显示属性

  @Column({ nullable: true })
  pNorm!: string // 一次额定值

  @Column({ nullable: true })
  pMin!: string // 一次最小值

  @Column({ nullable: true })
  pMax!: string // 一次最大值

  @Column({ nullable: true })
  sNorm!: string // 二次额定值

  @Column({ nullable: true })
  sMin!: string // 二次最小值

  @Column({ nullable: true })
  sMax!: string // 二次最大值

  @Column()
  parentPathId!: string

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
    }
  }
}
