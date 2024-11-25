import { TrgOps } from '@/model/dto'

export class LogControl {
  id!: string
  name!: string
  desc!: string
  datSet!: string
  intgPd!: number
  logName!: string
  logEna = true
  reasonCode = true
  trgOps!: TrgOps

  index!: number
  ldId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.datSet = props.datSet
      this.intgPd = props.intgPd
      this.logName = props.logName
      this.logEna = props.logEna
      this.reasonCode = props.reasonCode
      this.index = props.index
      this.ldId = props.ldId
    }
  }
}
