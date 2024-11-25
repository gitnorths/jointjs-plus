import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { SettingGroupItemMergeEntity } from './SettingGroupItemMergeEntity'
import { SettingGroupEntity } from './SettingGroupEntity'
import { SymbolBlockVarParamInstEntity } from '../program/symbolBlock/SymbolBlockVarParamInstEntity'

@Entity('dc_setting_group_item')
export class SettingGroupItemEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string // 短地址

  @Column({ nullable: true })
  desc!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  abbr!: string

  @Column({ nullable: true })
  format!: string // 显示格式

  @Column({ nullable: true })
  isBoot!: string // 是否修改后重启

  @Column({ nullable: true })
  matrix!: string

  @Column({ nullable: true })
  pMin!: string

  @Column({ nullable: true })
  pMax!: string

  @Column({ nullable: true })
  pNorm!: string

  @Column({ nullable: true })
  sMin!: string

  @Column({ nullable: true })
  sMax!: string

  @Column({ nullable: true })
  sNorm!: string

  @Column({ nullable: true })
  globalSetValue!: string

  @Column({ type: 'simple-array', nullable: true })
  multiSetValues!: string[]

  @OneToMany(() => SettingGroupItemMergeEntity, ns => ns.settingGroupItem)
  merges!: Relation<SettingGroupItemMergeEntity>[]

  @Column()
  groupId!: string

  @ManyToOne(() => SettingGroupEntity, group => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Relation<SettingGroupEntity>

  paramInstance!: SymbolBlockVarParamInstEntity

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.index = props.index
      this.abbr = props.abbr
      this.format = props.format
      this.isBoot = props.isBoot
      this.matrix = props.matrix
      this.pMin = props.pMin
      this.pMax = props.pMax
      this.pNorm = props.pNorm
      this.sMin = props.sMin
      this.sMax = props.sMax
      this.sNorm = props.sNorm
      this.globalSetValue = props.globalSetValue
      this.multiSetValues = props.multiSetValues
    }
    if (parent) {
      this.group = parent
      this.groupId = parent.id
    }
  }
}
