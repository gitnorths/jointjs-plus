import { Column, Entity, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { HWSlotConfigEntity } from './HWSlotConfigEntity'
import { HWFuncKeysEntity } from './HWFuncKeysEntity'
import { LEDConfigItemEntity } from './LEDConfigItemEntity'

/**
 * 硬件配置类.
 * @param {string} id - 数据库主键
 * @param {string} rackType - 机箱型号
 * @param {string} mainBoardType - 母板型号
 * @param {string} panelType - 面板型号
 * @param {string} lcdGraph - 液晶主画面
 * @param {Array<HWSlotConfigEntity>} slots - 母板插槽信息
 * @param {Array<HWFuncKeysEntity>} funcKeys - 功能按键
 */
@Entity('hw_config')
export class HWConfigEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  rackType!: string

  @Column({ nullable: true })
  mainBoardType!: string

  @Column({ nullable: true })
  panelType!: string

  @Column({ nullable: true, type: 'blob' })
  lcdGraph!: any

  @OneToMany(() => HWSlotConfigEntity, (slot) => slot.hardware)
  slots!: Relation<HWSlotConfigEntity>[]

  @OneToMany(() => HWFuncKeysEntity, (funcKey) => funcKey.hardware)
  funcKeys!: Relation<HWFuncKeysEntity>[]

  @OneToMany(() => LEDConfigItemEntity, (LED) => LED.hardware)
  leds!: Relation<LEDConfigItemEntity>[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.rackType = props.rackType
      this.mainBoardType = props.mainBoardType
      this.panelType = props.panelType
      this.lcdGraph = props.lcdGraph
    }
  }
}
