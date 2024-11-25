import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { ServicesEntity } from './ServicesEntity'

@Entity('iec61850_service_setting')
export class ServiceSettingEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  type!: string

  @Column()
  enable!: number

  @Column({ nullable: true })
  cbName!: number

  @Column({ nullable: true })
  datSet!: number

  @Column({ nullable: true })
  rptID!: number

  @Column({ nullable: true })
  svID!: number

  @Column({ nullable: true })
  optFields!: number

  @Column({ nullable: true })
  smpRate!: number

  @Column({ nullable: true })
  bufTime!: number

  @Column({ nullable: true })
  logEna!: number

  @Column({ nullable: true })
  trgOps!: number

  @Column({ nullable: true })
  intgPd!: number

  @Column({ nullable: true })
  appID!: number

  @Column({ nullable: true })
  dataLabel!: number

  @Column()
  servicesId!: string

  @ManyToOne(() => ServicesEntity, services => services.serviceSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'servicesId' })
  services!: Relation<ServicesEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable ? 1 : 0
      this.cbName = props.cbName
      this.datSet = props.datSet
      this.rptID = props.rptID
      this.svID = props.svID
      this.optFields = props.optFields
      this.smpRate = props.smpRate
      this.bufTime = props.bufTime
      this.logEna = props.logEna
      this.trgOps = props.trgOps
      this.intgPd = props.intgPd
      this.appID = props.appID
      this.dataLabel = props.dataLabel
    }
  }
}
