import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { EnableStatusEnum, SymbolTypeEnum } from '@/model/enum'
import { SymbolBlockVarInputInstEntity } from './SymbolBlockVarInputInstEntity'
import { SymbolBlockVarOutputInstEntity } from './SymbolBlockVarOutputInstEntity'
import { SymbolBlockVarParamInstEntity } from './SymbolBlockVarParamInstEntity'
import { SymbolBlockVarInnerInstEntity } from './SymbolBlockVarInnerInstEntity'
import { SymbolBlockVarOtherInstEntity } from './SymbolBlockVarOtherInstEntity'
import { PageEntity } from '../PageEntity'
import { ControlGroupItemEntity } from '../../signalGroup/controlGroup/ControlGroupItemEntity'

@Entity('pg_symbol_block_inst')
export class SymbolBlockInstEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  instName!: string

  @Column({ nullable: true })
  orderInPage!: number

  @Column({ type: 'numeric' })
  status!: EnableStatusEnum

  @Column({ nullable: true })
  sAddr!: string

  @Column()
  name!: string

  @Column()
  pathId!: string

  @Column({ nullable: true })
  searchPath!: string

  @Column({ type: 'numeric' })
  type!: SymbolTypeEnum

  @Column({ nullable: true, type: 'text' })
  help!: any

  @Column({ nullable: true })
  orgDesc!: string

  @Column({ nullable: true })
  showInstName!: number

  @Column()
  x!: number

  @Column()
  y!: number

  @OneToMany(() => SymbolBlockVarInputInstEntity, input => input.symbolBlock)
  inputs!: Relation<SymbolBlockVarInputInstEntity>[]

  @OneToMany(() => SymbolBlockVarOutputInstEntity, output => output.symbolBlock)
  outputs!: Relation<SymbolBlockVarOutputInstEntity>[]

  @OneToMany(() => SymbolBlockVarParamInstEntity, param => param.symbolBlock)
  params!: Relation<SymbolBlockVarParamInstEntity>[]

  @OneToMany(() => SymbolBlockVarInnerInstEntity, inner => inner.symbolBlock)
  inners!: Relation<SymbolBlockVarInnerInstEntity>[]

  @OneToMany(() => SymbolBlockVarOtherInstEntity, other => other.symbolBlock)
  others!: Relation<SymbolBlockVarOtherInstEntity>[]

  @Column()
  pageId!: string

  @ManyToOne(() => PageEntity, pageGraph => pageGraph.symbolBlocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page!: Relation<PageEntity>

  controlGroupItem!: ControlGroupItemEntity[]

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.instName = props.instName
      this.orderInPage = props.orderInPage
      this.status = props.status
      this.sAddr = props.sAddr
      this.name = props.name
      this.pathId = props.pathId
      this.searchPath = props.searchPath
      this.type = props.type
      this.help = props.help
      this.orgDesc = props.orgDesc
      this.showInstName = props.showInstName ? 1 : 0
      this.x = props.x
      this.y = props.y
    }
    if (parent) {
      this.page = parent
      this.pageId = parent.id
    }
  }
}
