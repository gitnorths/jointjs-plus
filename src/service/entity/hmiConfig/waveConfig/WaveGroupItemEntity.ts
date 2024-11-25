import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { WaveAttrEnum, WaveLevelEnum, WavePriorityEnum, WaveTriggerTypeEnum } from '@/model/enum'
import { WaveGroupEntity } from './WaveGroupEntity'
import { SymbolBlockVarOutputInstEntity } from '../../program/symbolBlock/SymbolBlockVarOutputInstEntity'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
@Entity('hmi_wave_group_item')
export class WaveGroupItemEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  abbr!: string // 词条

  @Column({ nullable: true })
  index!: number

  @Column({ nullable: true, type: 'numeric' })
  attr!: WaveAttrEnum // 分组类型

  @Column({ nullable: true, type: 'numeric' })
  level!: WaveLevelEnum // 通道等级

  @Column({ nullable: true })
  amp!: string // 幅值

  @Column({ nullable: true, type: 'numeric' })
  priority!: WavePriorityEnum // 触发优先级

  @Column({ nullable: true, type: 'numeric' })
  mode!: WaveTriggerTypeEnum // 触发方式

  @Column({ nullable: true })
  frontNum!: number // 故障前录波点数 0 - 120 0

  @Column({ nullable: true })
  groupId!: string // 额定值

  @ManyToOne(() => WaveGroupEntity, group => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Relation<WaveGroupEntity>

  outputInstance!: SymbolBlockVarOutputInstEntity

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.abbr = props.abbr
      this.index = props.index
      this.attr = props.attr
      this.level = props.level
      this.amp = props.amp
      this.priority = props.priority
      this.mode = props.mode
      this.frontNum = props.frontNum
    }
    if (parent) {
      this.group = parent
      this.groupId = parent.id
    }
  }
}
