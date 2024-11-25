import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { ReportControlEntity } from './ReportControlEntity'

@Entity('iec61850_opt_fields')
export class OptFieldsEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  seqNum!: number

  @Column({ nullable: true })
  timeStamp!: number

  @Column({ nullable: true })
  dataSet!: number

  @Column({ nullable: true })
  reasonCode!: number

  @Column({ nullable: true })
  dataRef!: number

  @Column({ nullable: true })
  bufOvfl!: number

  @Column({ nullable: true })
  entryID!: number

  @Column({ nullable: true })
  configRef!: number

  @Column({ nullable: true })
  segmentation!: number

  @Column()
  rptCtrlId!: string

  @OneToOne(() => ReportControlEntity, rptCtrl => rptCtrl.optFields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rptCtrlId' })
  rptCtrl!: Relation<ReportControlEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.seqNum = props.seqNum ? 1 : 0
      this.timeStamp = props.timeStamp ? 1 : 0
      this.dataSet = props.dataSet ? 1 : 0
      this.reasonCode = props.reasonCode ? 1 : 0
      this.dataRef = props.dataRef ? 1 : 0
      this.bufOvfl = props.bufOvfl ? 1 : 0
      this.entryID = props.entryID ? 1 : 0
      this.configRef = props.configRef ? 1 : 0
      this.segmentation = props.segmentation ? 1 : 0
    }
  }
}
