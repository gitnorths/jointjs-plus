import { Column, Entity, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { WaveConfigEntity } from './WaveConfigEntity'
import { WaveGroupEntity } from './WaveGroupEntity'

@Entity('hmi_wave_inst')
export class WaveInstEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  custom!: number

  @Column()
  inst!: number

  @OneToOne(() => WaveConfigEntity, config => config.waveInst)
  waveConfig!: Relation<WaveConfigEntity>

  @OneToMany(() => WaveGroupEntity, group => group.waveInst)
  waveGroups!: Relation<WaveGroupEntity>[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.custom = props.custom
      this.inst = props.inst
    }
  }
}
