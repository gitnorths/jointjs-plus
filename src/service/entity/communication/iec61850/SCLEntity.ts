import { Column, Entity, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { IEDEntity } from './IEDEntity'

@Entity('iec61850_scl')
export class SCLEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true, type: 'blob' })
  header?: any

  @Column({ nullable: true, type: 'blob' })
  communication?: any

  @OneToMany(() => IEDEntity, ied => ied.scl)
  iedList!: Relation<IEDEntity>[]
}
