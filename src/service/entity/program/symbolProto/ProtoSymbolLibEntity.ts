import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { ProtoSymbolBlockEntity } from './ProtoSymbolBlockEntity'
import { ProtoSymbolArchiveEntity } from './ProtoSymbolArchiveEntity'

/**
 * 符号库
 */
@Entity('proto_symbol_lib')
export class ProtoSymbolLibEntity {
  @PrimaryColumn()
  pathId!: string

  @Column()
  name!: string // 忽略大小写

  @Column({ nullable: true })
  desc!: string

  @Column()
  index!: number

  @OneToMany(() => ProtoSymbolBlockEntity, (sb) => sb.parent)
  children!: Relation<ProtoSymbolBlockEntity>[]

  @Column()
  parentPathId!: string

  @ManyToOne(() => ProtoSymbolArchiveEntity, repo => repo.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPathId' })
  parent!: Relation<ProtoSymbolArchiveEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.desc = props.desc
      this.index = props.index
    }
    if (parent) {
      this.parent = parent
      this.parentPathId = parent.pathId
    }
  }
}
