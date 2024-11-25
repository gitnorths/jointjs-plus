import { LEDColorEnum, LEDTypeEnum, YesNoEnum } from '@/model/enum'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { HWConfigEntity } from './HWConfigEntity'

@Entity('hmi_led_item')
export class LEDConfigItemEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: true })
  bayNo!: number

  @Column({ nullable: true })
  boardNo!: number

  @Column({ type: 'numeric' })
  color!: LEDColorEnum

  @Column({ type: 'numeric' })
  enable!: YesNoEnum // 是否使能

  @Column({ type: 'numeric' })
  flicker!: YesNoEnum // 是否闪烁

  @Column({ type: 'numeric' })
  keep!: YesNoEnum // 是否保持

  @Column({ type: 'numeric' })
  type!: LEDTypeEnum

  @Column()
  hardwareId!: string

  @ManyToOne(() => HWConfigEntity, (hardware) => hardware.leds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hardwareId' })
  hardware!: Relation<HWConfigEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.name = props.name
      this.bayNo = props.bayNo
      this.boardNo = props.boardNo
      this.color = props.color
      this.enable = props.enable
      this.flicker = props.flicker
      this.keep = props.keep
      this.type = props.type
    }
    if (parent) {
      this.hardware = parent
      this.hardwareId = parent.id
    }
  }
}
