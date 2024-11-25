import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'
import { PageEntity } from '../PageEntity'
import { LabelEntity } from './LabelEntity'

@Entity('pg_label_in')
export class LabelInEntity extends LabelEntity {
  @Column({ nullable: true })
  type!: string

  @Column()
  pageId!: string

  @ManyToOne(() => PageEntity, page => page.inLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page!: Relation<PageEntity>

  constructor (props?: any, parent?: any) {
    super(props)
    if (props) {
      this.type = props.type
    }
    if (parent) {
      this.page = parent
      this.pageId = parent.id
    }
  }
}
