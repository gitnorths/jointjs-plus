import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { SymbolTypeEnum } from '@/model/enum'
import { SymbolBlockVersionEntity } from './SymbolBlockVersionEntity'
import { SymbolLibEntity } from './SymbolLibEntity'

/**
 * 符号
 */
@Entity('repo_symbol_block')
export class SymbolBlockEntity {
  @PrimaryColumn()
  pathId!: string

  @Column()
  name!: string // 忽略大小写

  @Column({ nullable: true })
  desc!: string

  @Column({ type: 'numeric' })
  type!: SymbolTypeEnum // 符号类型

  @Column({ nullable: true })
  latest!: string // 记录最新版本

  @Column()
  index!: number

  @Column({ nullable: true, type: 'simple-array' })
  allVersions!: string[] // 记录所有归档的版本

  @OneToMany(() => SymbolBlockVersionEntity, (sb) => sb.parent)
  children!: Relation<SymbolBlockVersionEntity>[]

  @Column()
  parentPathId!: string

  @ManyToOne(() => SymbolLibEntity, (lib) => lib.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPathId' })
  parent!: Relation<SymbolLibEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.desc = props.desc
      this.type = props.type
      this.latest = props.latest
      this.index = props.index
      this.allVersions = props.allVersions
    }
    if (parent) {
      this.parent = parent
      this.parentPathId = parent.pathId
    }
  }
}
