import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { SAddrEntity } from './SAddrEntity'
import { DOIEntity } from './DOIEntity'
import { SDIEntity } from './SDIEntity'

@Entity('iec61850_dai')
export class DAIEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column()
  na!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  signalDesc!: string

  @Column({ nullable: true })
  bType!: number

  @Column({ nullable: true })
  valKind!: number

  @Column({ nullable: true })
  type!: string

  @Column({ nullable: true })
  fc!: number

  @Column({ nullable: true })
  value!: string

  @Column({ nullable: true })
  ix!: string

  @Column({ nullable: true })
  sendq!: number

  @Column({ nullable: true })
  sendt!: number

  @OneToMany(() => SAddrEntity, saddr => saddr.dai)
  sAddr!: Relation<SAddrEntity>[]

  @Column({ nullable: true })
  doiId!: string

  @ManyToOne(() => DOIEntity, doi => doi.daiList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doiId' })
  doi!: Relation<DOIEntity>

  @Column({ nullable: true })
  sdiId!: string

  @ManyToOne(() => SDIEntity, sdi => sdi.daiList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sdiId' })
  sdi!: Relation<SDIEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.na = props.na
      this.desc = props.desc
      this.signalDesc = props.signalDesc
      this.bType = props.bType
      this.valKind = props.valKind
      this.ix = props.ix
      this.type = props.type
      this.fc = props.fc
      this.value = props.value
      this.sendq = props.sendq ? 1 : 0
      this.sendt = props.sendt ? 1 : 0
    }
  }
}
