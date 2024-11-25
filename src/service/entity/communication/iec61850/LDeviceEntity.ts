import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { LNEntity } from './LNEntity'
import { DataSetEntity } from './dataSet/DataSetEntity'
import { ReportControlEntity } from './control/ReportControlEntity'
import { LogControlEntity } from './control/LogControlEntity'
import { GSEControlEntity } from './control/GSEControlEntity'
import { SampledValueControlEntity } from './control/SampledValueControlEntity'
import { SettingControlEntity } from './control/SettingControlEntity'
import { SCLControlEntity } from './control/SCLControlEntity'
import { ServerEntity } from './ServerEntity'

@Entity('iec61850_l_device')
export class LDeviceEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  index!: number

  @Column({ nullable: true })
  inst!: string

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: true })
  desc!: string

  @OneToMany(() => LNEntity, ln => ln.ld)
  lnList!: Relation<LNEntity>[]

  @OneToMany(() => DataSetEntity, dataSet => dataSet.ld)
  dataSetList!: Relation<DataSetEntity>[]

  @OneToMany(() => ReportControlEntity, rptCtrl => rptCtrl.ld)
  rptCtrlList!: Relation<ReportControlEntity>[]

  @OneToMany(() => LogControlEntity, logCtrl => logCtrl.ld)
  logCtrlList!: Relation<LogControlEntity>[]

  @OneToMany(() => GSEControlEntity, gseCtrl => gseCtrl.ld)
  gseCtrlList!: Relation<GSEControlEntity>[]

  @OneToMany(() => SampledValueControlEntity, svCtrl => svCtrl.ld)
  svCtrlList!: Relation<SampledValueControlEntity>[]

  @OneToMany(() => SettingControlEntity, settingCtrl => settingCtrl.ld)
  settingCtrlList!: Relation<SettingControlEntity>[]

  @OneToMany(() => SCLControlEntity, sclCtrl => sclCtrl.ld)
  sclCtrlList!: Relation<SCLControlEntity>[]

  @Column()
  serverId!: string

  @ManyToOne(() => ServerEntity, server => server.ldList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server!: Relation<ServerEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.inst = props.inst
      this.name = props.name
      this.desc = props.desc
    }
  }
}
