import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { ReportGroupItemEntity } from './ReportGroupItemEntity'
import { YesNoEnum } from '@/model/enum'

@Entity('dc_report_group')
export class ReportGroupEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: 'REPORT_TABLE' | 'FAULT_TABLE' | 'TRIP_TABLE' | 'SOE_TABLE' | 'CHG_TABLE' | 'CHECK_TABLE' | 'RUN_TABLE' | 'CUSTOM_TABLE' | string

  @Column()
  desc!: '报告类' | '整组报告' | '动作报告' | 'SOE报告' | '变位报告' | '自检报告' | '运行报告' | '自定义报告' | string

  @Column({ nullable: true, type: 'numeric' })
  reserved!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  isFolder!: YesNoEnum

  @Column({ nullable: true })
  index!: number // 排序

  @Column({ nullable: true })
  maxRecordNum!: number // 0 - 1024 256

  @Column({ nullable: true, type: 'simple-array' })
  attrFilter!: string[]

  @Column({ nullable: true })
  parentGroupId!: string

  @OneToMany(() => ReportGroupEntity, group => group.parentGroup)
  childGroups!: Relation<ReportGroupEntity>[]

  @ManyToOne(() => ReportGroupEntity, group => group.childGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentGroupId' })
  parentGroup!: Relation<ReportGroupEntity>

  @OneToMany(() => ReportGroupItemEntity, item => item.group)
  items!: Relation<ReportGroupItemEntity>[]

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.reserved = props.reserved
      this.isFolder = props.isFolder
      this.index = props.index
      this.maxRecordNum = props.maxRecordNum
      this.attrFilter = props.attrFilter
    }
    if (parent) {
      this.parentGroup = parent
      this.parentGroupId = parent.id
    }
  }
}
