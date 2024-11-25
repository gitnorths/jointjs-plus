import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'
import { SymbolBlockVersionEntity } from './SymbolBlockVersionEntity'
import { SymbolBlockVarEntity } from './SymbolBlockVarEntity'

@Entity('repo_symbol_var_param')
export class SymbolBlockVarParamEntity extends SymbolBlockVarEntity {
  @Column()
  value!: string // 设置值

  @ManyToOne(() => SymbolBlockVersionEntity, (sb) => sb.params, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPathId' })
  parent!: Relation<SymbolBlockVersionEntity>

  constructor (props?: any, parent?: any) {
    super(props)
    if (props) {
      this.value = props.value
    }
    if (parent) {
      this.parent = parent
      this.parentPathId = parent.pathId
    }
  }
}
