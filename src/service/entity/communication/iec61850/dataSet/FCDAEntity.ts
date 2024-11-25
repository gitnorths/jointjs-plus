import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { DataSetEntity } from './DataSetEntity'

@Entity('iec61850_fcda')
export class FCDAEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  ldInst!: string

  @Column({ nullable: true })
  prefix!: string

  @Column({ nullable: true })
  lnClass!: string

  @Column({ nullable: true })
  lnInst!: string

  @Column({ nullable: true })
  doName!: string

  @Column({ nullable: true })
  daName!: string

  @Column({ nullable: true })
  fc!: number

  @Column({ nullable: true })
  sendq!: number

  @Column({ nullable: true })
  sendt!: number

  @Column({ nullable: true })
  lnId!: string

  @Column({ nullable: true })
  daiId!: string

  @Column()
  index!: number

  @Column()
  dataSetId!: string

  @ManyToOne(() => DataSetEntity, dataSet => dataSet.fcdaList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataSetId' })
  dataSet!: Relation<DataSetEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id

      this.ldInst = props.ldInst
      this.prefix = props.prefix
      this.lnClass = props.lnClass
      this.lnInst = props.lnInst
      this.doName = props.doName
      this.daName = props.daName
      this.fc = props.fc
      this.index = props.index
      this.lnId = props.lnId
      this.daiId = props.daiId
      this.sendq = props.sendq ? 1 : 0
      this.sendt = props.sendt ? 1 : 0
    }
  }
}
