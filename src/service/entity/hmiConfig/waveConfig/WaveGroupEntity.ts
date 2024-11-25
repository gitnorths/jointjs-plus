import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { WaveInstEntity } from './WaveInstEntity'
import { WaveGroupItemEntity } from './WaveGroupItemEntity'

@Entity('hmi_wave_group')
export class WaveGroupEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: 'STATE_TABLE' | 'ANALOG_TABLE' | 'TRIG_TABLE' | 'REPORT_TABLE'

  @Column()
  desc!: '开关量通道' | '模拟量通道' | '录波触发信号' | '整组报告'

  @Column()
  index!: number // 排序

  @Column({ nullable: true, type: 'simple-array' })
  attrFilter!: string[]

  @OneToMany(() => WaveGroupItemEntity, item => item.group)
  items!: Relation<WaveGroupItemEntity>[]

  @Column()
  instId!: string

  @ManyToOne(() => WaveInstEntity, inst => inst.waveGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instId' })
  waveInst!: Relation<WaveInstEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.index = props.index
      this.attrFilter = props.attrFilter
    } else {
      this.attrFilter = []
    }
    if (parent) {
      this.waveInst = parent
      this.instId = parent.id
    }
  }
}
