import { Column, Entity, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { ModelRackSlotEntity } from './ModelRackSlotEntity'

@Entity('tpl_model_rack')
export class ModelRackEntity {
  @PrimaryColumn()
  name!: string // 机箱型号

  @Column({ nullable: true })
  desc!: string // 描述

  @Column()
  sn!: string // MOT编码

  @Column()
  type!: 'whole' | '1/2' | '1/3' // 尺寸信息

  @Column({ nullable: true })
  rackUnit!: '1U' | '2U' | '4U' | '8U' // 高度

  @Column({ nullable: true })
  height!: number // 高度

  @Column({ nullable: true })
  width!: number // 宽度

  @Column({ nullable: true })
  depth!: number // 深度

  @Column()
  insertType!: 'vertical' | 'horizontal' // 板卡插接方式

  @OneToMany(() => ModelRackSlotEntity, slot => slot.rack)
  slots!: Relation<ModelRackSlotEntity>[]
}
