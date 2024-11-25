import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { SampledValueControlEntity } from './SampledValueControlEntity'

@Entity('iec61850_smv_opts')
export class SmvOptsEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  refreshTime!: number

  @Column({ nullable: true })
  sampleSynchronized!: number

  @Column({ nullable: true })
  sampleRate!: number

  @Column({ nullable: true })
  security!: number

  @Column({ nullable: true })
  dataRef!: number

  @Column()
  svCtrlId!: string

  @OneToOne(() => SampledValueControlEntity, svCtrl => svCtrl.smvOpts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'svCtrlId' })
  svCtrl!: Relation<SampledValueControlEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.refreshTime = props.refreshTime ? 1 : 0
      this.sampleSynchronized = props.sampleSynchronized ? 1 : 0
      this.sampleRate = props.sampleRate ? 1 : 0
      this.security = props.security ? 1 : 0
      this.dataRef = props.dataRef ? 1 : 0
    }
  }
}
