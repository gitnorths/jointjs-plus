import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { SymbolBlockInstEntity } from './SymbolBlockInstEntity'
import { VariableTypeEnum } from '@/model/enum'

@Entity('pg_var_inner_inst')
export class SymbolBlockVarInnerInstEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string // 成员变量名

  @Column({ nullable: true })
  regName!: string // 注册变量名

  @Column()
  pathId!: string

  @Column({ nullable: true })
  searchPath!: string

  @Column({ nullable: true })
  sAddr!: string

  @Column()
  index!: number

  @Column({ type: 'numeric', nullable: true })
  type!: VariableTypeEnum // 变量类型

  @Column({ type: 'numeric', nullable: true })
  customType!: VariableTypeEnum // 变量类型

  @Column({ nullable: true })
  default!: string // 缺省值

  @Column({ nullable: true })
  value!: string // 设置值

  @Column()
  symbolBlockId!: string

  @ManyToOne(() => SymbolBlockInstEntity, symbolBlock => symbolBlock.inners, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'symbolBlockId' })
  symbolBlock!: Relation<SymbolBlockInstEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.regName = props.regName
      this.pathId = props.pathId
      this.searchPath = props.searchPath
      this.sAddr = props.sAddr
      this.index = props.index
      this.type = props.type
      this.customType = props.customType
      this.default = props.default
      this.value = props.value
      this.symbolBlockId = props.symbolBlockId
    }
    if (parent) {
      this.symbolBlock = parent
      this.symbolBlockId = parent.id
    }
  }
}
