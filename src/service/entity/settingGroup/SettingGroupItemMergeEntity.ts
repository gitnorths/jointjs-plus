import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { SymbolBlockVarParamInstEntity } from '../program/symbolBlock/SymbolBlockVarParamInstEntity'
import { SettingGroupItemEntity } from './SettingGroupItemEntity'

@Entity('dc_setting_group_item_merge')
export class SettingGroupItemMergeEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string // 短地址

  @Column()
  index!: number

  @Column()
  itemId!: string

  @ManyToOne(() => SettingGroupItemEntity, item => item.merges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  settingGroupItem!: Relation<SettingGroupItemEntity>

  paramInstance!: SymbolBlockVarParamInstEntity

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.index = props.index
    }
    if (parent) {
      this.settingGroupItem = parent
      this.itemId = parent.id
    }
  }
}
