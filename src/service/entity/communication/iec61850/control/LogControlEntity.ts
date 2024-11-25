import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { LDeviceEntity } from '../LDeviceEntity'
import { TrgOpsEntity } from './TrgOpsEntity'

@Entity('iec61850_log_control')
export class LogControlEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  datSet!: string

  @Column({ nullable: true })
  intgPd!: number

  @Column({ nullable: true })
  logName!: string

  @Column({ nullable: true })
  logEna!: number

  @Column({ nullable: true })
  reasonCode!: number

  @OneToOne(() => TrgOpsEntity, trgOps => trgOps.logCtrl)
  trgOps!: Relation<TrgOpsEntity>

  @Column()
  ldId!: string

  @ManyToOne(() => LDeviceEntity, ld => ld.logCtrlList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ldId' })
  ld!: Relation<LDeviceEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.datSet = props.datSet
      this.intgPd = props.intgPd
      this.logName = props.logName
      this.logEna = props.logEna ? 1 : 0
      this.reasonCode = props.reasonCode ? 1 : 0
    }
  }
}
