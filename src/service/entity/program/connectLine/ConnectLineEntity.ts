import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { ConnectLineRouterPointsEntity } from './ConnectLineRouterPointsEntity'
import { PageEntity } from '../PageEntity'
import { YesNoEnum } from '@/model/enum'

@Entity('pg_connect_line')
export class ConnectLineEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  headName!: string

  @Column({ nullable: true })
  headType!: string

  @Column()
  headNodeId!: string

  @Column()
  headSignalId!: string

  @Column({ nullable: true })
  headX!: number

  @Column({ nullable: true })
  headY!: number

  @Column()
  tailName!: string

  @Column({ nullable: true })
  tailType!: string

  @Column()
  tailNodeId!: string

  @Column()
  tailSignalId!: string

  @Column({ nullable: true })
  tailX!: number

  @Column({ nullable: true })
  tailY!: number

  @Column({ nullable: true, type: 'numeric' })
  breakCycle!: YesNoEnum // 通过线的样式代替破环符号

  @Column({ nullable: true })
  label!: string // 拉线标签值

  @OneToMany(() => ConnectLineRouterPointsEntity, point => point.connectLine)
  routerPoints!: Relation<ConnectLineRouterPointsEntity>[]

  @Column()
  pageId!: string

  @ManyToOne(() => PageEntity, pageGraph => pageGraph.connectLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page!: Relation<PageEntity>

  sAddr!: string

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.headName = props.headName
      this.headType = props.headType
      this.headNodeId = props.headNodeId
      this.headSignalId = props.headSignalId
      this.headX = props.headX
      this.headY = props.headY
      this.tailName = props.tailName
      this.tailType = props.tailType
      this.tailNodeId = props.tailNodeId
      this.tailSignalId = props.tailSignalId
      this.tailX = props.tailX
      this.tailY = props.tailY
      this.breakCycle = props.breakCycle
      this.label = props.label
      this.sAddr = props.sAddr
    }
    if (parent) {
      this.page = parent
      this.pageId = parent.id
    }
  }
}
