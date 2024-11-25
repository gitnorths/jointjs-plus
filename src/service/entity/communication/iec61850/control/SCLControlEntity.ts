import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { LDeviceEntity } from '../LDeviceEntity'

@Entity('iec61850_scl_control')
export class SCLControlEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  desc!: string

  @Column()
  ldId!: string

  @ManyToOne(() => LDeviceEntity, ld => ld.sclCtrlList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ldId' })
  ld!: Relation<LDeviceEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
    }
  }
}
