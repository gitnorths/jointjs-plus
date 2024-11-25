import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { AccessPointEntity } from './AccessPointEntity'

@Entity('iec61850_phys_conn')
export class PhysConnEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  physConnType!: string

  @Column({ nullable: true })
  port!: string

  @Column({ nullable: true })
  plug!: string

  @Column({ nullable: true })
  type!: string

  @Column({ nullable: true })
  cable!: number

  @Column()
  apId!: string

  @ManyToOne(() => AccessPointEntity, ap => ap.physConnList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'apId' })
  accessPoint!: Relation<AccessPointEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.physConnType = props.physConnType
      this.port = props.port
      this.plug = props.plug
      this.type = props.type
      this.cable = props.cable
      this.index = props.index
      this.apId = props.apId
    }
  }
}
