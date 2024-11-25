import {
  ClientServices,
  ConfDataSet,
  ConfLNs,
  ConfLogControl,
  ConfReportControl,
  DynAssociation,
  DynDataSet,
  Goose,
  GSESettings,
  GSSE,
  LogSettings,
  ReportSettings,
  SettingGroups,
  SMV,
  SMVSettings
} from '@/model/dto'

export class Services {
  id!: string
  confLdName = true
  dataObjectDirectory = true
  dataSetDirectory = true
  fileHandling = true
  gseDir = false
  getCBValues = true
  getDirectory = true
  getDataObjectDefinition = true
  getDataSetValue = true
  setDataSetValue = true
  readWrite = true
  timerActivatedControl = false

  confDataSet!: ConfDataSet
  confLogControl!: ConfLogControl
  confReportControl!: ConfReportControl
  dynAssociation!: DynAssociation
  dynDataSet!: DynDataSet
  goose!: Goose
  gsse!: GSSE
  smv!: SMV

  reportSettings!: ReportSettings
  logSettings!: LogSettings
  gseSettings!: GSESettings
  smvSettings!: SMVSettings

  confLNs!: ConfLNs
  settingGroups!: SettingGroups
  clientServices!: ClientServices

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.confLdName = props.confLdName
      this.dataObjectDirectory = props.dataObjectDirectory
      this.dataSetDirectory = props.dataSetDirectory
      this.fileHandling = props.fileHandling
      this.gseDir = props.gseDir
      this.getCBValues = props.getCBValues
      this.getDirectory = props.getDirectory
      this.getDataObjectDefinition = props.getDataObjectDefinition
      this.getDataSetValue = props.getDataSetValue
      this.setDataSetValue = props.setDataSetValue
      this.readWrite = props.readWrite
      this.timerActivatedControl = props.timerActivatedControl
    }
  }
}
