import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { LDeviceEntity } from './LDeviceEntity'
import { DOIEntity } from './DOIEntity'

@Entity('iec61850_ln')
export class LNEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  lnType!: string

  @Column({ nullable: true })
  lnClass!: string

  @Column({ nullable: true })
  inst!: string

  @Column({ nullable: true })
  prefix!: string

  @OneToMany(() => DOIEntity, doi => doi.ln)
  doiList!: Relation<DOIEntity>[]

  @Column()
  ldId!: string

  @ManyToOne(() => LDeviceEntity, ld => ld.lnList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ldId' })
  ld!: Relation<LDeviceEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.desc = props.desc
      this.lnType = props.lnType
      this.lnClass = props.lnClass
      this.inst = props.inst
      this.prefix = props.prefix
    }
  }
}
