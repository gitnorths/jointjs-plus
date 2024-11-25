import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'
import { SymbolBlockVersionEntity } from './SymbolBlockVersionEntity'
import { SymbolBlockVarEntity } from './SymbolBlockVarEntity'

@Entity('repo_symbol_var_input')
export class SymbolBlockVarInputEntity extends SymbolBlockVarEntity {
  @Column()
  value!: string // 设置值

  @Column()
  isShowGraph!: string // 是否在图上显示

  @ManyToOne(() => SymbolBlockVersionEntity, (sb) => sb.inputs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPathId' })
  parent!: Relation<SymbolBlockVersionEntity>

  constructor (props?: any, parent?: any) {
    super(props)
    if (props) {
      this.value = props.value
      this.isShowGraph = props.isShowGraph
    }
    if (parent) {
      this.parent = parent
      this.parentPathId = parent.pathId
    }
  }
}
