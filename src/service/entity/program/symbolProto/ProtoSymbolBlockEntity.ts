import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { SymbolTypeEnum } from '@/model/enum'
import { ProtoSymbolLibEntity } from './ProtoSymbolLibEntity'
import { PageEntity } from '../PageEntity'

/**
 * 符号
 */
@Entity('proto_symbol_block')
export class ProtoSymbolBlockEntity {
  @PrimaryColumn()
  pathId!: string // 忽略大小写

  @Column()
  name!: string

  @Column()
  version!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ type: 'numeric' })
  type!: SymbolTypeEnum // 符号类型

  @Column({ nullable: true, type: 'text' })
  help!: string // 帮助文本

  @Column({ type: 'text', nullable: true })
  model!: string

  @Column({ type: 'text', nullable: true })
  graphic!: string

  @Column()
  index!: number

  @Column()
  parentPathId!: string

  @ManyToOne(() => ProtoSymbolLibEntity, (lib) => lib.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPathId' })
  parent!: Relation<ProtoSymbolLibEntity>

  @OneToOne(() => PageEntity, page => page.pageSymbol, { onDelete: 'CASCADE' })
  page!: Relation<PageEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.version = props.version
      this.desc = props.desc
      this.type = props.type
      this.help = props.help
      this.model = props.model
      this.graphic = props.graphic
      this.index = props.index
    }
    if (parent) {
      this.parent = parent
      this.parentPathId = parent.pathId
    }
  }
}
