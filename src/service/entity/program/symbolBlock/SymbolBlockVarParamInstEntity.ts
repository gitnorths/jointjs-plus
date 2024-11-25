import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'
import { ISymbolBlockVarInstEntity } from './ISymbolBlockVarInstEntity'
import { SymbolBlockInstEntity } from './SymbolBlockInstEntity'
import { SettingGroupItemMergeEntity } from '../../settingGroup/SettingGroupItemMergeEntity'
import { SettingGroupItemEntity } from '../../settingGroup/SettingGroupItemEntity'

@Entity('pg_var_param_inst')
export class SymbolBlockVarParamInstEntity extends ISymbolBlockVarInstEntity {
  @Column({ nullable: true })
  value!: string // 设置值

  @Column()
  symbolBlockId!: string

  @ManyToOne(() => SymbolBlockInstEntity, sb => sb.params, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'symbolBlockId' })
  symbolBlock!: Relation<SymbolBlockInstEntity>

  settingGroupItem!: SettingGroupItemEntity

  settingGroupItemNs!: SettingGroupItemMergeEntity

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
