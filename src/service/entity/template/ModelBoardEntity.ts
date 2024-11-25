import { Column, Entity, PrimaryColumn } from 'typeorm'
import { BoardAbilityEnum } from '@/model/enum'

@Entity('tpl_model_board')
export class ModelBoardEntity {
  @PrimaryColumn()
  name!: string // 板卡型号

  @Column({ nullable: true })
  sn!: string // MOT编码

  @Column({ nullable: true })
  desc!: string // 描述

  @Column({ type: 'numeric', nullable: true })
  ability!: BoardAbilityEnum

  @Column({ nullable: true })
  cpuCoreNums!: number

  // TODO sg port是什么？
  constructor (props?: any) {
    if (props) {
      this.name = props.name
      this.sn = props.sn
      this.desc = props.desc
      this.ability = props.ability
      this.cpuCoreNums = props.cpuCoreNums
    }
  }
}
