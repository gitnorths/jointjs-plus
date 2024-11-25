import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { PageEntity } from './PageEntity'
import { VariableTypeEnum } from '@/model/enum'

@Entity('pg_link_dot')
export class LinkDotInstEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  x!: number

  @Column()
  y!: number

  @Column({ nullable: true, type: 'numeric' })
  varType!: VariableTypeEnum

  @Column()
  pageId!: string

  @ManyToOne(() => PageEntity, page => page.linkDots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page!: Relation<PageEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.x = props.x
      this.y = props.y
      this.varType = props.varType
    }
    if (parent) {
      this.page = parent
      this.pageId = parent.id
    }
  }
}
