import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { LDeviceEntity } from '../LDeviceEntity'

@Entity('iec61850_gse_control')
export class GSEControlEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  datSet!: string

  @Column({ nullable: true })
  confRev!: number

  @Column()
  type!: number

  @Column({ nullable: true })
  appId!: string

  @Column({ nullable: true, type: 'simple-array' })
  IEDName!: string[]

  @Column()
  ldId!: string

  @ManyToOne(() => LDeviceEntity, ld => ld.gseCtrlList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ldId' })
  ld!: Relation<LDeviceEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.datSet = props.datSet
      this.confRev = props.confRev
      this.type = props.type
      this.appId = props.appId
    }
  }
}
