import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { CustomGroupItemEntity } from './CustomGroupItemEntity'
import { YesNoEnum } from '@/model/enum'

@Entity('dc_custom_group')
export class CustomGroupEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column()
  desc!: string

  @Column({ nullable: true, type: 'numeric' })
  reserved!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  isFolder!: YesNoEnum

  @Column({ nullable: true })
  index!: number // 排序

  @Column({ nullable: true })
  parentGroupId!: string

  @OneToMany(() => CustomGroupEntity, group => group.parentGroup)
  childGroups!: Relation<CustomGroupEntity>[]

  @ManyToOne(() => CustomGroupEntity, group => group.childGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentGroupId' })
  parentGroup!: Relation<CustomGroupEntity>

  @OneToMany(() => CustomGroupItemEntity, item => item.group)
  items!: Relation<CustomGroupItemEntity>[]

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
