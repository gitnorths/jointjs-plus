import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { ServicesEntity } from './services/ServicesEntity'
import { AccessPointEntity } from './AccessPointEntity'
import { SCLEntity } from './SCLEntity'

@Entity('iec61850_ied')
export class IEDEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  icdName!: string

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: true })
  index!: number

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  type!: string

  @Column({ nullable: true })
  owner!: string

  @Column({ nullable: true })
  manufacturer!: string

  @Column({ nullable: true })
  configVersion!: string

  @Column({ nullable: true })
  originalSclVersion!: string

  @Column({ nullable: true })
  originalSclRevision!: string

  @OneToOne(() => ServicesEntity, services => services.ied)
  services!: Relation<ServicesEntity>

  @OneToMany(() => AccessPointEntity, accessPoint => accessPoint.ied)
  accessPointList!: Relation<AccessPointEntity>[]

  @Column()
  sclId!: string

  @ManyToOne(() => SCLEntity, scl => scl.iedList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sclId' })
  scl!: Relation<SCLEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.icdName = props.icdName
      this.name = props.name
      this.index = props.index
      this.desc = props.desc
      this.type = props.type
      this.owner = props.owner
      this.manufacturer = props.manufacturer
      this.configVersion = props.configVersion
      this.originalSclVersion = props.originalSclVersion
      this.originalSclRevision = props.originalSclRevision
      this.sclId = props.sclId
    }
  }
}
