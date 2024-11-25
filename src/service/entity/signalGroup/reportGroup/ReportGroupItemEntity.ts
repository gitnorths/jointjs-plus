import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { ReportGroupEntity } from './ReportGroupEntity'
import { SymbolBlockVarOutputInstEntity } from '../../program/symbolBlock/SymbolBlockVarOutputInstEntity'
import { SignalClassifyEnum, TripTypeEnum } from '@/model/enum'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
@Entity('dc_report_group_item')
export class ReportGroupItemEntity {
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

  @Column({ nullable: true })
  t!: string // 时标

  @Column({ nullable: true })
  q!: string // 品质

  @Column({ nullable: true, type: 'numeric' })
  tripType!: TripTypeEnum // 动作类型

  @Column({ nullable: true })
  param!: string // 参数

  @Column({ nullable: true, type: 'numeric' })
  classify!: SignalClassifyEnum // 词条

  @Column({ nullable: true })
  groupId!: string // 额定值

  @ManyToOne(() => ReportGroupEntity, group => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Relation<ReportGroupEntity>

  outputInstance!: SymbolBlockVarOutputInstEntity

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.abbr = props.abbr
      this.index = props.index
      this.t = props.t
      this.q = props.q
      this.tripType = props.tripType
      this.param = props.param
      this.classify = props.classify
    }
    if (parent) {
      this.group = parent
      this.groupId = parent.id
    }
  }
}
