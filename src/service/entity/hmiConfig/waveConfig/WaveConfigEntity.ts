import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { WaveFrequencyItemEntity } from './WaveFrequencyItemEntity'
import { WaveInstEntity } from './WaveInstEntity'

@Entity('hmi_wave_config')
export class WaveConfigEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  maxItemNum!: number // 最大保存整组数

  @Column({ nullable: true })
  minItemNum!: number // 低优先级保留的条目数

  @Column({ nullable: true })
  maxRecordNum!: number // 录波的最大录波点数

  @OneToMany(() => WaveFrequencyItemEntity, freq => freq.waveConfig)
  frequencies!: Relation<WaveFrequencyItemEntity>[]

  @Column()
  instId!: string

  @OneToOne(() => WaveInstEntity, inst => inst.waveConfig)
  @JoinColumn({ name: 'instId' })
  waveInst!: Relation<WaveInstEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.maxItemNum = props.maxItemNum
      this.minItemNum = props.minItemNum
      this.maxRecordNum = props.maxRecordNum
    }
    if (parent) {
      this.waveInst = parent
      this.instId = parent.id
    }
  }
}
