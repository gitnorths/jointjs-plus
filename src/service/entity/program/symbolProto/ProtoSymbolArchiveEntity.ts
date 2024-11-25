import { Column, Entity, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { ProtoSymbolLibEntity } from './ProtoSymbolLibEntity'

/**
 * 符号库
 */
@Entity('proto_symbol_archive')
export class ProtoSymbolArchiveEntity {
  @PrimaryColumn()
  pathId!: string

  @Column()
  name!: string // 忽略大小写

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  organization!: string // 中研院平台、思宏瑞、清能等等

  @Column({ nullable: true })
  toolVersion!: string

  @OneToMany(() => ProtoSymbolLibEntity, lib => lib.parent)
  children!: Relation<ProtoSymbolLibEntity>[]

  constructor (props?: any) {
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.desc = props.desc
      this.organization = props.organization
      this.toolVersion = props.toolVersion
    }
  }
}
