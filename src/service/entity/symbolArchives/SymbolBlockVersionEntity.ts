import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { SymbolBlockVarInputEntity } from './SymbolBlockVarInputEntity'
import { SymbolBlockVarOutputEntity } from './SymbolBlockVarOutputEntity'
import { SymbolBlockVarParamEntity } from './SymbolBlockVarParamEntity'
import { SymbolBlockVarInnerEntity } from './SymbolBlockVarInnerEntity'
import { SymbolBlockVarOtherEntity } from './SymbolBlockVarOtherEntity'
import { SymbolBlockEntity } from './SymbolBlockEntity'

/**
 * 符号版本
 */
@Entity('repo_symbol_block_version')
export class SymbolBlockVersionEntity {
  @PrimaryColumn()
  pathId!: string

  @Column()
  name!: string

  @Column()
  version!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true, type: 'text' })
  help!: string // 帮助文本

  @Column()
  index!: number

  @Column({ type: 'text', nullable: true })
  modelFile!: string

  @Column({ type: 'text', nullable: true })
  graphicFile!: string

  @Column({ type: 'blob', nullable: true })
  headFile!: Buffer

  @Column({ type: 'blob', nullable: true })
  srcFile!: Buffer

  @Column({ type: 'blob', nullable: true })
  libFile!: Buffer

  @OneToMany(() => SymbolBlockVarInputEntity, (input) => input.parent)
  inputs!: Relation<SymbolBlockVarInputEntity>[]

  @OneToMany(() => SymbolBlockVarOutputEntity, (output) => output.parent)
  outputs!: Relation<SymbolBlockVarOutputEntity>[]

  @OneToMany(() => SymbolBlockVarParamEntity, (param) => param.parent)
  params!: Relation<SymbolBlockVarParamEntity>[]

  @OneToMany(() => SymbolBlockVarInnerEntity, (inner) => inner.parent)
  inners!: Relation<SymbolBlockVarInnerEntity>[]

  @OneToMany(() => SymbolBlockVarOtherEntity, (other) => other.parent)
  others!: Relation<SymbolBlockVarOtherEntity>[]

  @Column()
  parentPathId!: string

  @ManyToOne(() => SymbolBlockEntity, (proto) => proto.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPathId' })
  parent!: Relation<SymbolBlockEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.version = props.version
      this.desc = props.desc
      this.help = props.help
      this.index = props.index
      this.modelFile = props.modelFile
      this.graphicFile = props.graphicFile
      this.headFile = props.headFile
      this.srcFile = props.srcFile
      this.libFile = props.libFile
    }
    if (parent) {
      this.parent = parent
      this.parentPathId = parent.pathId
    }
  }
}
