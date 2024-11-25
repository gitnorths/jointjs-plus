import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { LDeviceEntity } from './LDeviceEntity'
import { AccessPointEntity } from './AccessPointEntity'

@Entity('iec61850_server')
export class ServerEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  timeout!: string

  @OneToMany(() => LDeviceEntity, lDevice => lDevice.server)
  ldList!: Relation<LDeviceEntity>[]

  @Column()
  accessPointId!: string

  @OneToOne(() => AccessPointEntity, accessPoint => accessPoint.server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accessPointId' })
  accessPoint!: Relation<AccessPointEntity>
}
