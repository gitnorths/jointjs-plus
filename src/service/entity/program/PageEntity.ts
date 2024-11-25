import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { EnableStatusEnum, TaskLevelEnum, YesNoEnum } from '@/model/enum'
import { SymbolBlockInstEntity } from './symbolBlock/SymbolBlockInstEntity'
import { ConnectLineEntity } from './connectLine/ConnectLineEntity'
import { LinkDotInstEntity } from './LinkDotInstEntity'
import { PageAnnotationEntity } from './PageAnnotationEntity'
import { LabelInEntity } from './label/LabelInEntity'
import { LabelOutEntity } from './label/LabelOutEntity'
import { ProcessItemEntity } from './ProcessItemEntity'
import { PGSnippetEntity } from './PGSnippetEntity'
import { PGCoreInfoEntity } from './PGCoreInfoEntity'
import { ProtoSymbolBlockEntity } from './symbolProto/ProtoSymbolBlockEntity'

/**
 * 程序页面实体类
 * @param {string} id - 数据库id，uuid
 * @param {string} name - 页面名称
 * @param {YesNoEnum} isFolder - 是否是页面组
 * @param {YesNoEnum} isSnippet - 是否是代码片段
 * @param {string} searchPath - 定位路径
 * @param {number} index - 页面在当前组的编号
 * @param {string} pageSize - 页面大小尺寸信息，A3/A4
 * @param {TaskLevelEnum} level - 中断等级
 * @param {number} status - 页面使能，投退状态
 * @param {Array.<SymbolBlockInstEntity>} symbolBlocks - 功能块实例列表
 * @param {Array.<ConnectLineEntity>} connectLines - 连线列表
 * @param {Array.<LinkDotInstEntity>} linkDots - 连接点列表（兼容老工程，新工程废弃）
 * @param {Array.<PageAnnotationEntity>} annotations - 页面注解
 * @param {Array.<LabelInEntity>} inLabels - 输入标签
 * @param {Array.<LabelOutEntity>} outLabels - 输出标签
 * @param {ProcessItemEntity} process - 关联进程实体
 * @param {string} processId - 关联进程id
 * @param {PGSnippetEntity} snippet - 关联代码片段
 * @param {string} snippetId - 关联代码片段id
 * @param {PGCoreInfoEntity} core - 关联cpu核
 * @param {string} coreId - 关联cpu核id
 * @constructor
 */

@Entity('pg_page')
export class PageEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column({ nullable: true, type: 'numeric' })
  isFolder!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  isSnippet!: YesNoEnum

  @Column({ nullable: true })
  searchPath!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  pageSize!: 'A3' | 'A4'

  @Column({ nullable: true, type: 'numeric' })
  level!: TaskLevelEnum

  @Column({ type: 'numeric' })
  status!: EnableStatusEnum

  @Column({ type: 'simple-array', nullable: true })
  permissions!: string[] // FIXME 角色:权限数字 0-不可见 1-只读 2-可编辑

  // 符号列表 component block
  @OneToMany(() => SymbolBlockInstEntity, xb => xb.page)
  symbolBlocks!: Relation<SymbolBlockInstEntity>[]

  // 连接线
  @OneToMany(() => ConnectLineEntity, cLine => cLine.page)
  connectLines!: Relation<ConnectLineEntity>[]

  // 连接点
  @OneToMany(() => LinkDotInstEntity, ls => ls.page)
  linkDots!: Relation<LinkDotInstEntity>[]

  @OneToMany(() => PageAnnotationEntity, an => an.page)
  annotations!: Relation<PageAnnotationEntity>[]

  @OneToMany(() => LabelInEntity, an => an.page)
  inLabels!: Relation<LabelInEntity>[]

  @OneToMany(() => LabelOutEntity, an => an.page)
  outLabels!: Relation<LabelOutEntity>[]

  // 组合符号
  @Column({ nullable: true })
  snippetId!: string

  @ManyToOne(() => PGSnippetEntity, snippet => snippet.pages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'snippetId' })
  snippet!: Relation<PGSnippetEntity>

  // 单核单进程
  @Column({ nullable: true })
  coreId!: string

  @ManyToOne(() => PGCoreInfoEntity, core => core.pages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coreId' })
  core!: Relation<PGCoreInfoEntity>

  // 主CPU独立进程
  @Column({ nullable: true })
  processItemId!: string

  @ManyToOne(() => ProcessItemEntity, process => process.pages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'processItemId' })
  processItem!: Relation<ProcessItemEntity>

  // 页面组
  @Column({ nullable: true })
  parentPageId!: string

  @ManyToOne(() => PageEntity, page => page.childPages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentPageId' })
  parentPage!: Relation<PageEntity>

  @OneToMany(() => PageEntity, page => page.parentPage)
  childPages!: Relation<PageEntity>[]

  @Column({ nullable: true })
  pageSymbolPathId!: string

  @OneToOne(() => ProtoSymbolBlockEntity, pageSymbol => pageSymbol.page)
  @JoinColumn({ name: 'pageSymbolPathId' })
  pageSymbol!: Relation<ProtoSymbolBlockEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.isFolder = props.isFolder
      this.isSnippet = props.isSnippet
      this.searchPath = props.searchPath
      this.index = props.index
      this.pageSize = props.pageSize
      this.level = props.level
      this.status = props.status
      this.permissions = props.permissions
      this.pageSymbolPathId = props.pageSymbolPathId
    }
  }
}
