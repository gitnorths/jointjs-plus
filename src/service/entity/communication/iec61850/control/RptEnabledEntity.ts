import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { ClientLNEntity } from './ClientLNEntity'
import { ReportControlEntity } from './ReportControlEntity'

@Entity('iec61850_rpt_enabled')
export class RptEnabledEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  max!: number

  @OneToMany(() => ClientLNEntity, clientLN => clientLN.rptEnabled)
  clientLNList!: Relation<ClientLNEntity>[]

  @Column()
  rptCtrlId!: string

  @OneToOne(() => ReportControlEntity, rptCtrl => rptCtrl.rptEnabled, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rptCtrlId' })
  rptCtrl!: Relation<ReportControlEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.max = props.max
    }
  }
}
