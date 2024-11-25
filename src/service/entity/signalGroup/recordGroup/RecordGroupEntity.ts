import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { RecordGroupItemEntity } from './RecordGroupItemEntity'
import { YesNoEnum } from '@/model/enum'

@Entity('dc_record_group')
export class RecordGroupEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: 'RECORD_TABLE' | 'ACC_TABLE' | 'ADJUST_TABLE' | string

  @Column()
  desc!: '纪录类' | '累计量' | '校准通道' | string

  @Column({ nullable: true, type: 'numeric' })
  reserved!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  isFolder!: YesNoEnum

  @Column({ nullable: true })
  index!: number // 排序

  @Column({ nullable: true })
  parentGroupId!: string

  @OneToMany(() => RecordGroupEntity, group => group.parentGroup)
  childGroups!: Relation<RecordGroupEntity>[]

  @ManyToOne(() => RecordGroupEntity, group => group.childGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentGroupId' })
  parentGroup!: Relation<RecordGroupEntity>

  @OneToMany(() => RecordGroupItemEntity, item => item.group)
  items!: Relation<RecordGroupItemEntity>[]

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
