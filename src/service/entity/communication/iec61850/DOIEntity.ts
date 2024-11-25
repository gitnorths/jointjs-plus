import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { SDIEntity } from './SDIEntity'
import { DAIEntity } from './DAIEntity'
import { LNEntity } from './LNEntity'

@Entity('iec61850_doi')
export class DOIEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  ix!: string

  @Column({ nullable: true })
  accessControl!: string

  @Column({ nullable: true })
  cdc!: string

  @OneToMany(() => SDIEntity, sdi => sdi.doi)
  sdiList!: Relation<SDIEntity>[]

  @OneToMany(() => DAIEntity, dai => dai.doi)
  daiList!: Relation<DAIEntity>[]

  @Column()
  lnId!: string

  @ManyToOne(() => LNEntity, ln => ln.doiList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lnId' })
  ln!: Relation<LNEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.ix = props.ix
      this.accessControl = props.accessControl
      this.cdc = props.cdc
    }
  }
}
