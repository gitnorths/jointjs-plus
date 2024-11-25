import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { PGOptBoardEntity } from './PGOptBoardEntity'
import { ProcessItemEntity } from './ProcessItemEntity'
import { PageEntity } from './PageEntity'
import { YesNoEnum } from '@/model/enum'

/**
 * CPU核实体类
 * @param {string} id - 数据库id
 * @param {string} name - 核名称
 * @param {number} cpuIndex - CPU编号
 * @param {number} coreIndex - 核编号
 * @param {number} mainCpu - 是否是主CPU
 * @param {number} mainDsp - 是否是主DSP
 * @constructor
 */
@Entity('pg_cpu_core')
export class PGCoreInfoEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column()
  cpuIndex!: number

  @Column()
  coreIndex!: number

  @Column({ nullable: true, type: 'numeric' })
  mainCpu!: YesNoEnum

  @Column({ nullable: true, type: 'numeric' })
  mainDsp!: YesNoEnum

  @Column({ nullable: true })
  optBoardId!: string

  @ManyToOne(() => PGOptBoardEntity, (slot) => slot.cpuCores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optBoardId' })
  optBoard!: Relation<PGOptBoardEntity>

  @OneToMany(() => ProcessItemEntity, (proc) => proc.core)
  processItems!: Relation<ProcessItemEntity>[]

  @OneToMany(() => PageEntity, page => page.core)
  pages!: Relation<PageEntity>[]

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.cpuIndex = props.cpuIndex
      this.coreIndex = props.coreIndex
      this.mainCpu = props.mainCpu
      this.mainDsp = props.mainDsp
    }
    if (parent) {
      this.optBoard = parent
      this.optBoardId = parent.id
    }
  }
}
