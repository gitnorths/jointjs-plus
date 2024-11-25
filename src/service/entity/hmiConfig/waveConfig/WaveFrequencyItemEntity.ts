import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { WaveFrequencyTypeEnum } from '@/model/enum'
import { WaveConfigEntity } from './WaveConfigEntity'

@Entity('hmi_wave_frequency_item')
export class WaveFrequencyItemEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  num!: number // 记录点数 1

  @Column({ type: 'numeric' })
  type!: WaveFrequencyTypeEnum.INSTANT // 记录数据类型 INSTANT

  @Column({ nullable: true })
  value!: number

  @Column()
  index!: number

  @Column()
  waveConfigId!: string

  @ManyToOne(() => WaveConfigEntity, cfg => cfg.frequencies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'waveConfigId' })
  waveConfig!: Relation<WaveConfigEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.num = props.num
      this.type = props.type
      this.value = props.value
      this.index = props.index
    }
    if (parent) {
      this.waveConfig = parent
      this.waveConfigId = parent.id
    }
  }
}
