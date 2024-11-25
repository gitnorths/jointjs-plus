import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { TrgOpsEntity } from './TrgOpsEntity'
import { OptFieldsEntity } from './OptFieldsEntity'
import { RptEnabledEntity } from './RptEnabledEntity'
import { LDeviceEntity } from '../LDeviceEntity'

@Entity('iec61850_report_control')
export class ReportControlEntity {
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
  rptID!: string

  @Column({ nullable: true })
  confRev!: number

  @Column({ nullable: true })
  buffered!: number

  @Column({ nullable: true })
  bufTime!: number

  @Column({ nullable: true })
  indexed!: number

  @OneToOne(() => TrgOpsEntity, trgOps => trgOps.rptCtrl)
  trgOps!: Relation<TrgOpsEntity>

  @OneToOne(() => OptFieldsEntity, optFields => optFields.rptCtrl)
  optFields!: Relation<OptFieldsEntity>

  @OneToOne(() => RptEnabledEntity, rptEnabled => rptEnabled.rptCtrl)
  rptEnabled!: Relation<RptEnabledEntity>

  @Column()
  ldId!: string

  @ManyToOne(() => LDeviceEntity, ld => ld.rptCtrlList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ldId' })
  ld!: Relation<LDeviceEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.datSet = props.datSet
      this.intgPd = props.intgPd
      this.rptID = props.rptID
      this.confRev = props.confRev
      this.buffered = props.buffered ? 1 : 0
      this.bufTime = props.bufTime
      this.indexed = props.indexed ? 1 : 0
    }
  }
}
