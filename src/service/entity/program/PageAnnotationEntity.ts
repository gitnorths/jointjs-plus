import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { PageEntity } from './PageEntity'

/**
 * 页面注解实体类
 * @param {string} id - 数据库id，uuid
 * @constructor
 */
@Entity('pg_annotation')
export class PageAnnotationEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  value!: string

  @Column()
  x!: number

  @Column()
  y!: number

  @Column()
  width!: number

  @Column()
  height!: number

  @Column({ nullable: true })
  color!: number

  @Column()
  pageId!: string

  @ManyToOne(() => PageEntity, pageGraph => pageGraph.annotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page!: Relation<PageEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.value = props.value
      this.x = props.x
      this.y = props.y
      this.width = props.width
      this.height = props.height
      this.color = props.color
      this.pageId = props.pageId
    }
    if (parent) {
      this.page = parent
      this.pageId = parent.id
    }
  }
}
