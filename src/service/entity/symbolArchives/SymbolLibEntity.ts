import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { SymbolBlockEntity } from './SymbolBlockEntity'
import { SymbolArchiveEntity } from './SymbolArchiveEntity'

/**
 * 符号库
 */
@Entity('repo_symbol_lib')
export class SymbolLibEntity {
  @PrimaryColumn()
  pathId!: string

  @Column()
  name!: string // 忽略大小写

  @Column({ nullable: true })
  desc!: string

  @Column()
  index!: number

  @OneToMany(() => SymbolBlockEntity, (sb) => sb.parent)
  children!: Relation<SymbolBlockEntity>[]

  @Column()
  parentPathId!: string

  @ManyToOne(() => SymbolArchiveEntity, repo => repo.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPathId' })
  parent!: Relation<SymbolArchiveEntity>

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
