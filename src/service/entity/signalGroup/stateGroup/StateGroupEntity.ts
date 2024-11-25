import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { StateGroupItemEntity } from './StateGroupItemEntity'
import { YesNoEnum } from '@/model/enum'

@Entity('dc_state_group')
export class StateGroupEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: 'STATE_TABLE' | 'YX_TABLE' | 'YC_TABLE' | 'MEA_TABLE' | string

  @Column()
  desc!: '状态量' | '遥信' | '遥测' | '测量' | string

  @Column({ nullable: true, type: 'numeric' })
  reserved!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  isFolder!: YesNoEnum

  @Column({ nullable: true })
  index!: number // 排序

  @Column({ nullable: true, type: 'simple-array' })
  attrFilter!: string[]

  @Column({ nullable: true })
  parentGroupId!: string

  @OneToMany(() => StateGroupEntity, group => group.parentGroup)
  childGroups!: Relation<StateGroupEntity>[]

  @ManyToOne(() => StateGroupEntity, group => group.childGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentGroupId' })
  parentGroup!: Relation<StateGroupEntity>

  @OneToMany(() => StateGroupItemEntity, item => item.group)
  items!: Relation<StateGroupItemEntity>[]

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.reserved = props.reserved
      this.isFolder = props.isFolder
      this.index = props.index
      this.attrFilter = props.attrFilter
    }
    if (parent) {
      this.parentGroup = parent
      this.parentGroupId = parent.id
    }
  }
}
