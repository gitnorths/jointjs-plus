import { SettingEnum } from '@/model/enum'

export class GSESettings {
  id!: string
  type = 'GSESettings'
  enable = false
  cbName!: SettingEnum
  datSet!: SettingEnum
  appID!: SettingEnum
  dataLabel!: SettingEnum

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.cbName = props.cbName
      this.datSet = props.datSet
      this.appID = props.appID
      this.dataLabel = props.dataLabel
    }
  }
}
