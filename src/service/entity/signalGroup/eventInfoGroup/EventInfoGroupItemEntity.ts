import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { EventInfoGroupEntity } from './EventInfoGroupEntity'
import { SymbolBlockVarOutputInstEntity } from '../../program/symbolBlock/SymbolBlockVarOutputInstEntity'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
@Entity('dc_event_info_group_item')
export class EventInfoGroupItemEntity {
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
  groupId!: string // 额定值

  @ManyToOne(() => EventInfoGroupEntity, group => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Relation<EventInfoGroupEntity>

  outputInstance!: SymbolBlockVarOutputInstEntity

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.abbr = props.abbr
      this.index = props.index
    }
    if (parent) {
      this.group = parent
      this.groupId = parent.id
    }
  }
}
