import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'
import { PageEntity } from '../PageEntity'
import { LabelEntity } from './LabelEntity'

@Entity('pg_label_out')
export class LabelOutEntity extends LabelEntity {
  @Column({ nullable: true })
  type!: string

  @Column()
  pageId!: string

  @ManyToOne(() => PageEntity, page => page.outLabels, { onDelete: 'CASCADE' })
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
