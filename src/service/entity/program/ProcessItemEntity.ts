import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { PGCoreInfoEntity } from './PGCoreInfoEntity'
import { PageEntity } from './PageEntity'
import { YesNoEnum } from '@/model/enum'

/**
 * 进程实体类
 * @param {string} id - 数据库id，uuid
 * @param {string} name - 进程名称
 * @param {string} inst - 对应符号实例名称
 * @param {string} args - 参数
 * @param {number} enable - 是否是能
 * @param {number} index - 下标
 * @param {string} coreId - 关联核 id
 * @param {PGCoreInfoEntity} core - 关联核实体
 * @param {Array.<PageEntity>} pages - 程序页面列表
 * @constructor
 */
@Entity('pg_process')
export class ProcessItemEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column()
  inst!: string

  @Column({ nullable: true })
  args!: string

  @Column({ type: 'numeric' })
  enable!: YesNoEnum

  @Column()
  index!: number

  @Column()
  coreId!: string

  @ManyToOne(() => PGCoreInfoEntity, core => core.processItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coreId' })
  core!: Relation<PGCoreInfoEntity>

  @OneToMany(() => PageEntity, page => page.processItem)
  pages!: Relation<PageEntity>[]

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.inst = props.inst
      this.args = props.args
      this.enable = props.enable
      this.index = props.index
    }
    if (parent) {
      this.core = parent
      this.coreId = parent.id
    }
  }
}
