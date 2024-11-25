import { Column, Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { ModelRackEntity } from './ModelRackEntity'
import { BoardAbilityEnum } from '@/model/enum'

@Entity('tpl_model_rack_slot')
export class ModelRackSlotEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  slot!: number

  @Column({ nullable: true, type: 'simple-array' })
  abilityList!: BoardAbilityEnum[]

  @Column({ nullable: true, type: 'simple-array' })
  typeList!: string[]

  @ManyToOne(() => ModelRackEntity, rack => rack.slots)
  rack!: Relation<ModelRackEntity>
}
