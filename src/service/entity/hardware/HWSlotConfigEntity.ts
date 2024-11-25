import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { BoardAbilityEnum, YesNoEnum } from '@/model/enum'
import { HWConfigEntity } from './HWConfigEntity'

/**
 * 插槽类.
 * @param {string} id - 数据库主键
 * @param {number} slot - 板卡槽号
 * @param {string} type - 当前板卡类型
 * @param {BoardAbilityEnum} ability - 当前板卡能力
 * @param {string} sn - 当前板卡MOT编码
 * @param {string} desc - 描述
 * @param {number} optional - 是否可选板卡
 * @param {Array.<BoardAbilityEnum>} slotAbilityList - 插槽能力
 * @param {Array.<string>} optTypeList - 可选板卡列表
 * @constructor
 */

@Entity('hw_slot_config')
export class HWSlotConfigEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  slot!: number

  @Column({ nullable: true })
  type!: string

  @Column({ nullable: true, type: 'numeric' })
  ability!: BoardAbilityEnum

  @Column({ nullable: true })
  sn!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true, type: 'numeric' })
  optional!: YesNoEnum

  @Column({ nullable: true, type: 'simple-array' })
  slotAbilityList!: BoardAbilityEnum[]

  @Column({ nullable: true, type: 'simple-array' })
  optTypeList!: string[]

  @Column({ nullable: true })
  hardwareId!: string

  @ManyToOne(() => HWConfigEntity, (hardware) => hardware.slots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hardwareId' })
  hardware!: Relation<HWConfigEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.slot = props.slot
      this.type = props.type
      this.ability = props.ability
      this.sn = props.sn
      this.desc = props.desc
      this.optional = props.optional
      this.slotAbilityList = props.slotAbilityList
      this.optTypeList = props.optTypeList
    }
    if (parent) {
      this.hardware = parent
      this.hardwareId = parent.id
    }
  }
}
