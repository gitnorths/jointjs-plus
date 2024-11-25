import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { DAIEntity } from './DAIEntity'
import { DOIEntity } from './DOIEntity'

@Entity('iec61850_sdi')
export class SDIEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  ix!: string

  @OneToMany(() => SDIEntity, sdi => sdi.sdi)
  sdiList!: Relation<SDIEntity>[]

  @OneToMany(() => DAIEntity, dai => dai.sdi)
  daiList!: Relation<DAIEntity>[]

  @Column({ nullable: true })
  sdiId!: string

  @ManyToOne(() => SDIEntity, sdi => sdi.sdiList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sdiId' })
  sdi!: Relation<SDIEntity>

  @Column({ nullable: true })
  doiId!: string

  @ManyToOne(() => DOIEntity, doi => doi.sdiList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doiId' })
  doi!: Relation<DOIEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.ix = props.ix
    }
  }
}
