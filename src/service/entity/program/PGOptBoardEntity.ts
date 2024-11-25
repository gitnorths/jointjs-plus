import { Column, Entity, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { PGCoreInfoEntity } from './PGCoreInfoEntity'
import { BoardAbilityEnum } from '@/model/enum'

/**
 * 可选板卡实例类.
 * @param {string} id - 数据库主键
 * @param {number} slot - 板卡槽号
 * @param {string} type - 板卡类型
 * @param {string} desc - 描述
 * @param {Array<PGCoreInfoEntity>} cpus - 板载CPU列表
 * @constructor
 */

@Entity('pg_optional_board')
export class PGOptBoardEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  slot!: number

  @Column({ nullable: true })
  type!: string

  @Column({ type: 'numeric', nullable: true })
  ability!: BoardAbilityEnum

  @Column({ nullable: true })
  desc!: string

  @OneToMany(() => PGCoreInfoEntity, core => core.optBoard)
  cpuCores!: Relation<PGCoreInfoEntity>[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.slot = props.slot
      this.type = props.type
      this.ability = props.ability
      this.desc = props.desc
    }
  }
}
