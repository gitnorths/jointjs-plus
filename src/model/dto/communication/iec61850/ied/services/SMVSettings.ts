import { SettingEnum } from '@/model/enum'

export class SMVSettings {
  id!: string
  type = 'SMVSettings'
  enable = false
  cbName!: SettingEnum
  datSet!: SettingEnum
  svID!: SettingEnum
  optFields!: SettingEnum
  smpRate!: SettingEnum

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.cbName = props.cbName
      this.datSet = props.datSet
      this.svID = props.svID
      this.optFields = props.optFields
      this.smpRate = props.smpRate
    }
  }
}
