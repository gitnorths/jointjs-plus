import { OptFields, RptEnabled, TrgOps } from '@/model/dto'

export class ReportControl {
  id!: string
  name!: string
  desc!: string
  datSet!: string
  intgPd!: number
  rptID!: string
  confRev!: number
  buffered = false
  bufTime = 0
  indexed = true
  trgOps!: TrgOps
  optFields!: OptFields
  rptEnabled!: RptEnabled

  ldId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.datSet = props.datSet
      this.intgPd = props.intgPd
      this.rptID = props.rptID
      this.confRev = props.confRev
      this.buffered = props.buffered
      this.bufTime = props.bufTime
      this.indexed = props.indexed
      this.ldId = props.ldId
    }
  }
}
