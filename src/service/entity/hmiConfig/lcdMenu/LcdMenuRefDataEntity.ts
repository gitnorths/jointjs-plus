import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { LcdMenuEntity } from './LcdMenuEntity'

@Entity('hmi_lcd_menu_ref_data')
export class LcdMenuRefDataEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column({ nullable: true })
  abbr!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  t!: string

  @Column({ nullable: true })
  q!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  setAttr!: string // 定值属性，可选配置（只针对高性能项目）；定值类条目需要配置此属性，配置为0数据默认显示，配置为1数据只在内部调试模式显示。

  @Column()
  menuId!: string

  @ManyToOne(() => LcdMenuEntity, lcd => lcd.refDatas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuId' })
  menu!: Relation<LcdMenuEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.abbr = props.abbr
      this.desc = props.desc
      this.t = props.t
      this.q = props.q
      this.index = props.index
      this.setAttr = props.setAttr
    }
    if (parent) {
      this.menu = parent
      this.menuId = parent.id
    }
  }
}
