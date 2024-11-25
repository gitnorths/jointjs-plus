import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm'
import { ServiceOptionEntity } from './ServiceOptionEntity'
import { ServiceSettingEntity } from './ServiceSettingEntity'
import { ServiceConfEntity } from './ServiceConfEntity'
import { IEDEntity } from '../IEDEntity'

@Entity('iec61850_service')
export class ServicesEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  confLdName!: number

  @Column({ nullable: true })
  dataObjectDirectory!: number

  @Column({ nullable: true })
  dataSetDirectory!: number

  @Column({ nullable: true })
  fileHandling!: number

  @Column({ nullable: true })
  gseDir!: number

  @Column({ nullable: true })
  getCBValues!: number

  @Column({ nullable: true })
  getDirectory!: number

  @Column({ nullable: true })
  getDataObjectDefinition!: number

  @Column({ nullable: true })
  getDataSetValue!: number

  @Column({ nullable: true })
  setDataSetValue!: number

  @Column({ nullable: true })
  readWrite!: number

  @Column({ nullable: true })
  timerActivatedControl!: number

  // confDataSet confLogControl confReportControl dynAssociation dynDataSet goose gsse smv
  @OneToMany(() => ServiceOptionEntity, serviceOpt => serviceOpt.services)
  serviceOptions!: Relation<ServiceOptionEntity>[]

  // reportSettings logSettings gseSettings smvSettings
  @OneToMany(() => ServiceSettingEntity, serviceSet => serviceSet.services)
  serviceSettings!: Relation<ServiceSettingEntity>[]

  // confLNs settingGroups clientServices
  @OneToMany(() => ServiceConfEntity, serviceSet => serviceSet.services)
  serviceConfs!: Relation<ServiceConfEntity>[]

  @Column()
  iedId!: string

  @OneToOne(() => IEDEntity, ied => ied.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'iedId' })
  ied!: Relation<IEDEntity>

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.confLdName = props.confLdName ? 1 : 0
      this.dataObjectDirectory = props.dataObjectDirectory ? 1 : 0
      this.dataSetDirectory = props.dataSetDirectory ? 1 : 0
      this.fileHandling = props.fileHandling ? 1 : 0
      this.gseDir = props.gseDir ? 1 : 0
      this.getCBValues = props.getCBValues ? 1 : 0
      this.getDirectory = props.getDirectory ? 1 : 0
      this.getDataObjectDefinition = props.getDataObjectDefinition ? 1 : 0
      this.getDataSetValue = props.getDataSetValue ? 1 : 0
      this.setDataSetValue = props.setDataSetValue ? 1 : 0
      this.readWrite = props.readWrite ? 1 : 0
      this.timerActivatedControl = props.timerActivatedControl ? 1 : 0
    }
  }
}
