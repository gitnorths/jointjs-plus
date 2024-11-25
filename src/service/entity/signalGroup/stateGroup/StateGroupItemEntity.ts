import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { DbCatEnum, SignalClassifyEnum } from '@/model/enum'
import { StateGroupEntity } from './StateGroupEntity'
import { SymbolBlockVarOutputInstEntity } from '../../program/symbolBlock/SymbolBlockVarOutputInstEntity'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
@Entity('dc_state_group_item')
export class StateGroupItemEntity {
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

  @Column({ nullable: true })
  evt!: number // 是否事件

  @Column({ nullable: true, type: 'numeric' })
  classify: SignalClassifyEnum = SignalClassifyEnum.Protect

  @Column({ nullable: true, type: 'numeric' })
  db_cat!: DbCatEnum // 变化死区类型

  @Column({ nullable: true })
  norm!: string // 额定值

  @Column({ nullable: true })
  groupId!: string // 额定值

  @ManyToOne(() => StateGroupEntity, group => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Relation<StateGroupEntity>

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
      this.evt = props.evt
      this.classify = props.classify
      this.db_cat = props.db_cat
      this.norm = props.norm
    }
    if (parent) {
      this.group = parent
      this.groupId = parent.id
    }
  }
}
