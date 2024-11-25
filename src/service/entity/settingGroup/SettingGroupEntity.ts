import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { SettingGroupItemEntity } from './SettingGroupItemEntity'
import { YesNoEnum } from '@/model/enum'

@Entity('dc_setting_group')
export class SettingGroupEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true, type: 'numeric' })
  reserved!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  isFolder!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  lcdModify!: YesNoEnum // 是否允许HMI整定 1

  @Column({ nullable: true, type: 'numeric' })
  multiSet!: YesNoEnum // 是否支持多区 0-否 1-是 0

  @Column({ nullable: true, type: 'numeric' })
  reboot!: YesNoEnum // 是否重启 0-不重启 1-重启DSP 2-重启装置 0

  @Column({ nullable: true, type: 'numeric' })
  remoteModify!: YesNoEnum // 禁止远方修改 0

  @Column({ nullable: true })
  index!: number // 排序

  @Column({ nullable: true })
  parentGroupId!: string

  @OneToMany(() => SettingGroupItemEntity, item => item.group)
  items!: Relation<SettingGroupItemEntity>[]

  @OneToMany(() => SettingGroupEntity, group => group.parentGroup)
  childGroups!: Relation<SettingGroupEntity>[]

  @ManyToOne(() => SettingGroupEntity, group => group.childGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentGroupId' })
  parentGroup!: Relation<SettingGroupEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.reserved = props.reserved
      this.isFolder = props.isFolder
      this.lcdModify = props.lcdModify
      this.multiSet = props.multiSet
      this.reboot = props.reboot
      this.remoteModify = props.remoteModify
      this.index = props.index
    }
    if (parent) {
      this.parentGroup = parent
      this.parentGroupId = parent.id
    }
  }
}
