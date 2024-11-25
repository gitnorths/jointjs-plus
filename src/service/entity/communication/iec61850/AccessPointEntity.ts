import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { ServerEntity } from './ServerEntity'
import { PhysConnEntity } from './PhysConnEntity'
import { IEDEntity } from './IEDEntity'

@Entity('iec61850_access_point')
export class AccessPointEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  router!: number

  @Column({ nullable: true })
  clock!: number

  @OneToOne(() => ServerEntity, server => server.accessPoint)
  server!: Relation<ServerEntity>

  @OneToMany(() => PhysConnEntity, phys => phys.accessPoint)
  physConnList!: Relation<PhysConnEntity>[]

  @Column()
  iedId!: string

  @ManyToOne(() => IEDEntity, ied => ied.accessPointList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'iedId' })
  ied!: Relation<IEDEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.name = props.name
      this.desc = props.desc
      this.router = props.router ? 1 : 0
      this.clock = props.clock ? 1 : 0
    }
  }
}
