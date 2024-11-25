import { SettingEnum } from '@/model/enum'

export class ReportSettings {
  id!: string
  type = 'ReportSettings'
  enable = false
  cbName!: SettingEnum
  datSet!: SettingEnum
  rptID!: SettingEnum
  optFields!: SettingEnum
  bufTime!: SettingEnum
  trgOps!: SettingEnum
  intgPd!: SettingEnum

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.cbName = props.cbName
      this.datSet = props.datSet
      this.rptID = props.rptID
      this.optFields = props.optFields
      this.bufTime = props.bufTime
      this.trgOps = props.trgOps
      this.intgPd = props.intgPd
    }
  }
}
