import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { LcdAuthEnum, YesNoEnum } from '@/model/enum'
import { LcdMenuRefDataEntity } from './LcdMenuRefDataEntity'

@Entity('hmi_lcd_menu')
export class LcdMenuEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column({ nullable: true })
  abbr!: string

  @Column({ nullable: true })
  func!: string

  @Column({ type: 'numeric', nullable: true })
  auth!: LcdAuthEnum

  @Column({ nullable: true })
  ps !: number // 页面一二次值显示属性，可选配置；不配置页面根据一二次值显示定值自动切换显示，配置为0显示一次值，配置为1显示二次值。

  @Column({ type: 'numeric' })
  isFolder!: YesNoEnum

  @Column()
  index!: number

  @OneToMany(() => LcdMenuEntity, lcdMenu => lcdMenu.parentMenu)
  menus!: Relation<LcdMenuEntity>[]

  @Column({ nullable: true })
  parentMenuId!: string

  @ManyToOne(() => LcdMenuEntity, lcdMenu => lcdMenu.menus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentMenuId' })
  parentMenu!: Relation<LcdMenuEntity>

  @OneToMany(() => LcdMenuRefDataEntity, refData => refData.menu)
  refDatas!: Relation<LcdMenuRefDataEntity>[]

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.abbr = props.abbr
      this.func = props.func
      this.auth = props.auth
      this.ps = props.ps
      this.isFolder = props.isFolder
      this.index = props.index
    }
    if (parent) {
      this.parentMenu = parent
      this.parentMenuId = parent.id
    }
  }
}
