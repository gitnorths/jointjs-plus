import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { DAIEntity } from './DAIEntity'
import { EnableStatusEnum } from '@/model/enum'

@Entity('iec61850_sAddr')
export class SAddrEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  prefix!: string

  @Column()
  na!: string

  @Column({ nullable: true })
  position!: number // 0,1 单点都是0，双点有0有1

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  zeroDrift!: string

  @Column({ nullable: true })
  deadZone!: string

  @Column({ nullable: true })
  isInput!: number

  @Column({ nullable: true })
  isOutput!: number

  @Column({ nullable: true })
  isParam!: number

  @Column({ nullable: true })
  daiId!: string

  @ManyToOne(() => DAIEntity, dai => dai.sAddr, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'daiId' })
  dai!: Relation<DAIEntity>

  enabled!: EnableStatusEnum

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.na = props.na
      this.position = props.position
      this.desc = props.desc
      this.prefix = props.prefix
      this.deadZone = props.deadZone
      this.zeroDrift = props.zeroDrift
      this.isInput = props.isInput ? 1 : 0
      this.isOutput = props.isOutput ? 1 : 0
      this.isParam = props.isParam ? 1 : 0
    }
  }
}
