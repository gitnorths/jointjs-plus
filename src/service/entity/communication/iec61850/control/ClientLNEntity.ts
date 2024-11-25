import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { RptEnabledEntity } from './RptEnabledEntity'

@Entity('iec61850_client_ln')
export class ClientLNEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  iedName!: string

  @Column({ nullable: true })
  ldInst!: string

  @Column({ nullable: true })
  prefix!: string

  @Column({ nullable: true })
  lnClass!: string

  @Column({ nullable: true })
  lnInst!: string

  @Column()
  index!: number

  @Column()
  rptEnabledId!: string

  @ManyToOne(() => RptEnabledEntity, rptEnabled => rptEnabled.clientLNList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rptEnabledId' })
  rptEnabled!: Relation<RptEnabledEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.iedName = props.iedName
      this.ldInst = props.ldInst
      this.prefix = props.prefix
      this.lnClass = props.lnClass
      this.lnInst = props.lnInst
      this.index = props.index
    }
  }
}
