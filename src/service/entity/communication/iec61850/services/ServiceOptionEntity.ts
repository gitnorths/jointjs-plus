import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { ServicesEntity } from './ServicesEntity'

@Entity('iec61850_service_option')
export class ServiceOptionEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  type!: string

  @Column()
  enable!: number

  @Column({ nullable: true })
  max!: number

  @Column({ nullable: true })
  maxAttributes!: number

  @Column({ nullable: true })
  bufMode!: number

  @Column({ nullable: true })
  bufConf!: number

  @Column({ nullable: true })
  modify!: number

  @Column({ nullable: true })
  fccb!: number

  @Column()
  servicesId!: string

  @ManyToOne(() => ServicesEntity, services => services.serviceOptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'servicesId' })
  services!: Relation<ServicesEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable ? 1 : 0
      this.max = props.max
      this.maxAttributes = props.maxAttributes
      this.bufMode = props.bufMode
      this.bufConf = props.bufConf ? 1 : 0
      this.modify = props.modify ? 1 : 0
      this.fccb = props.fccb ? 1 : 0
    }
  }
}
