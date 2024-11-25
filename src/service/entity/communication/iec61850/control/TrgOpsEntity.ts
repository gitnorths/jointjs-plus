import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { ReportControlEntity } from './ReportControlEntity'
import { LogControlEntity } from './LogControlEntity'

@Entity('iec61850_trg_ops')
export class TrgOpsEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  dchg!: number

  @Column({ nullable: true })
  qchg!: number

  @Column({ nullable: true })
  dupd!: number

  @Column({ nullable: true })
  period!: number

  @Column({ nullable: true })
  rptCtrlId!: string

  @OneToOne(() => ReportControlEntity, rptCtrl => rptCtrl.trgOps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rptCtrlId' })
  rptCtrl!: Relation<ReportControlEntity>

  @Column({ nullable: true })
  logCtrlId!: string

  @OneToOne(() => LogControlEntity, logCtrl => logCtrl.trgOps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'logCtrlId' })
  logCtrl!: Relation<LogControlEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.dchg = props.dchg ? 1 : 0
      this.qchg = props.qchg ? 1 : 0
      this.dupd = props.dupd ? 1 : 0
      this.period = props.period ? 1 : 0
    }
  }
}
