import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'
import { SymbolBlockInstEntity } from './SymbolBlockInstEntity'
import { ISymbolBlockVarInstEntity } from './ISymbolBlockVarInstEntity'

@Entity('pg_var_output_inst')
export class SymbolBlockVarOutputInstEntity extends ISymbolBlockVarInstEntity {
  @Column({ nullable: true })
  value!: string // 设置值

  @Column()
  symbolBlockId!: string

  @ManyToOne(() => SymbolBlockInstEntity, sb => sb.outputs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'symbolBlockId' })
  symbolBlock!: Relation<SymbolBlockInstEntity>

  constructor (props?: any, parent?: any) {
    super(props)
    if (props) {
      this.value = props.value
    }
    if (parent) {
      this.symbolBlock = parent
      this.symbolBlockId = parent.id
    }
  }
}
