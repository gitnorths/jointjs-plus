import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { LDeviceEntity } from '../LDeviceEntity'

@Entity('iec61850_setting_control')
export class SettingControlEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  numOfSGs!: number

  @Column({ nullable: true })
  actSG!: number

  @Column()
  ldId!: string

  @ManyToOne(() => LDeviceEntity, ld => ld.settingCtrlList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ldId' })
  ld!: Relation<LDeviceEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.numOfSGs = props.numOfSGs
      this.actSG = props.actSG
    }
  }
}
