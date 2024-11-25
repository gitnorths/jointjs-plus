import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { LDeviceEntity } from '../LDeviceEntity'
import { FCDAEntity } from './FCDAEntity'

@Entity('iec61850_dataset')
export class DataSetEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column({ nullable: true })
  desc!: string

  @Column()
  index!: number

  @OneToMany(() => FCDAEntity, fcda => fcda.dataSet)
  fcdaList!: Relation<FCDAEntity>[]

  @Column()
  ldId!: string

  @ManyToOne(() => LDeviceEntity, ld => ld.dataSetList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ldId' })
  ld!: Relation<LDeviceEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.index = props.index
    }
  }
}
