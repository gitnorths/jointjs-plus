import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { ServicesEntity } from './ServicesEntity'

@Entity('iec61850_service_config')
export class ServiceConfEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  type!: string

  @Column()
  enable!: number

  @Column({ nullable: true })
  fixPrefix!: number

  @Column({ nullable: true })
  fixLnInst!: number

  @Column({ nullable: true })
  sgEdit!: number

  @Column({ nullable: true })
  confSG!: number

  @Column({ nullable: true })
  goose!: number

  @Column({ nullable: true })
  gsse!: number

  @Column({ nullable: true })
  bufReport!: number

  @Column({ nullable: true })
  unbufReport!: number

  @Column({ nullable: true })
  readLog!: number

  @Column({ nullable: true })
  sv!: number

  @Column({ nullable: true })
  fccb!: number

  @Column()
  servicesId!: string

  @ManyToOne(() => ServicesEntity, services => services.serviceConfs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'servicesId' })
  services!: Relation<ServicesEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable ? 1 : 0
      this.fixPrefix = props.fixPrefix ? 1 : 0
      this.fixLnInst = props.fixLnInst ? 1 : 0
      this.sgEdit = props.sgEdit ? 1 : 0
      this.confSG = props.confSG ? 1 : 0
      this.goose = props.goose ? 1 : 0
      this.gsse = props.gsse ? 1 : 0
      this.bufReport = props.bufReport ? 1 : 0
      this.unbufReport = props.unbufReport ? 1 : 0
      this.readLog = props.readLog ? 1 : 0
      this.sv = props.sv ? 1 : 0
      this.fccb = props.fccb ? 1 : 0
    }
  }
}
