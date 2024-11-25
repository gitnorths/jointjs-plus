import { SettingEnum } from '@/model/enum'

export class LogSettings {
  id!: string
  type = 'LogSettings'
  enable = false
  cbName!: SettingEnum
  datSet!: SettingEnum
  logEna!: SettingEnum
  trgOps!: SettingEnum
  intgPd!: SettingEnum

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.cbName = props.cbName
      this.datSet = props.datSet
      this.logEna = props.logEna
      this.trgOps = props.trgOps
      this.intgPd = props.intgPd
    }
  }
}
