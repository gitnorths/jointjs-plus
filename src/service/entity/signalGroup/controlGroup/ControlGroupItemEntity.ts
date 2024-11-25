import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { ControlGroupEntity } from './ControlGroupEntity'
import { SymbolBlockInstEntity } from '../../program/symbolBlock/SymbolBlockInstEntity'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
@Entity('dc_control_group_item')
export class ControlGroupItemEntity {
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

  @Column()
  groupId!: string

  @ManyToOne(() => ControlGroupEntity, group => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Relation<ControlGroupEntity>

  symbolInst!: SymbolBlockInstEntity

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
