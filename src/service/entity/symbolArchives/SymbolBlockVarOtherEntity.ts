import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { VariableTypeEnum } from '@/model/enum'
import { SymbolBlockVersionEntity } from './SymbolBlockVersionEntity'

@Entity('repo_symbol_var_other')
export class SymbolBlockVarOtherEntity {
  @PrimaryColumn()
  pathId!: string

  @Column()
  name!: string // 成员变量名

  @Column({ nullable: true })
  regName!: string // 注册变量名

  @Column()
  index!: number

  @Column({ type: 'numeric' })
  type!: VariableTypeEnum // 变量类型

  @Column({ nullable: true, type: 'simple-array' })
  optTypeList!: VariableTypeEnum[] // 输出可变类型列表

  @Column()
  default!: string // 缺省值

  @Column()
  parentPathId!: string

  @ManyToOne(() => SymbolBlockVersionEntity, (sb) => sb.others, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPathId' })
  parent!: Relation<SymbolBlockVersionEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.regName = props.regName
      this.index = props.index
      this.type = props.type
      this.optTypeList = props.optTypeList
      this.default = props.default
    }
    if (parent) {
      this.parent = parent
      this.parentPathId = parent.pathId
    }
  }
}
