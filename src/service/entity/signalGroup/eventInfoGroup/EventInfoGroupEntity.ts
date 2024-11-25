import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { EventInfoGroupItemEntity } from './EventInfoGroupItemEntity'
import { YesNoEnum } from '@/model/enum'

@Entity('dc_event_info_group')
export class EventInfoGroupEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: 'EVENT_INFO_TABLE' | 'TRIP_PARA_TABLE' | string

  @Column()
  desc!: '事件信息表' | '动作报告信息' | string

  @Column({ nullable: true, type: 'numeric' })
  reserved!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  isFolder!: YesNoEnum

  @Column({ nullable: true })
  index!: number // 排序

  @Column({ nullable: true })
  parentGroupId!: string

  @OneToMany(() => EventInfoGroupEntity, group => group.parentGroup)
  childGroups!: Relation<EventInfoGroupEntity>[]

  @ManyToOne(() => EventInfoGroupEntity, group => group.childGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentGroupId' })
  parentGroup!: Relation<EventInfoGroupEntity>

  @OneToMany(() => EventInfoGroupItemEntity, item => item.group)
  items!: Relation<EventInfoGroupItemEntity>[]

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.reserved = props.reserved
      this.isFolder = props.isFolder
      this.index = props.index
    }
    if (parent) {
      this.parentGroup = parent
      this.parentGroupId = parent.id
    }
  }
}
