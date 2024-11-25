import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { ControlGroupItemEntity } from './ControlGroupItemEntity'
import { YesNoEnum } from '@/model/enum'

@Entity('dc_control_group')
export class ControlGroupEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: 'CTRL_TABLE' | 'YK_TABLE' | 'YT_TABLE' | 'YM_TABLE' | 'DRIVE_TABLE' | string

  @Column()
  desc!: '控制类' | '遥控' | '遥调' | '遥脉' | '开出传动' | string

  @Column({ nullable: true, type: 'numeric' })
  reserved!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  isFolder!: YesNoEnum

  @Column({ nullable: true })
  index!: number // 排序

  @Column({ nullable: true })
  parentGroupId!: string

  @OneToMany(() => ControlGroupEntity, group => group.parentGroup)
  childGroups!: Relation<ControlGroupEntity>[]

  @ManyToOne(() => ControlGroupEntity, group => group.childGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentGroupId' })
  parentGroup!: Relation<ControlGroupEntity>

  @OneToMany(() => ControlGroupItemEntity, item => item.group)
  items!: Relation<ControlGroupItemEntity>[]

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
