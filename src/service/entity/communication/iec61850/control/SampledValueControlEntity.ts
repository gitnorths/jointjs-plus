import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { SmvOptsEntity } from './SmvOptsEntity'
import { LDeviceEntity } from '../LDeviceEntity'

@Entity('iec61850_sv_control')
export class SampledValueControlEntity {
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

  @Column({ nullable: true })
  smvID!: string

  @Column({ nullable: true })
  multicast!: number

  @Column({ nullable: true })
  smpRate!: number

  @Column({ nullable: true })
  nofASDU!: number

  @Column({ nullable: true, type: 'simple-array' })
  IEDName: string[] = []

  @OneToOne(() => SmvOptsEntity, smvOpts => smvOpts.svCtrl)
  smvOpts!: Relation<SmvOptsEntity>

  @Column()
  ldId!: string

  @ManyToOne(() => LDeviceEntity, ld => ld.svCtrlList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ldId' })
  ld!: Relation<LDeviceEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.datSet = props.datSet
      this.confRev = props.confRev
      this.smvID = props.smvID
      this.multicast = props.multicast ? 1 : 0
      this.smpRate = props.smpRate
      this.nofASDU = props.nofASDU
    }
  }
}
