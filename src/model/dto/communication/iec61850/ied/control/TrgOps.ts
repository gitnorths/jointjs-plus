export class TrgOps {
  id!: string
  dchg = false
  qchg = false
  dupd = false
  period = false
  rptCtrlId!: string
  logCtrlId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.dchg = props.dchg
      this.qchg = props.qchg
      this.dupd = props.dupd
      this.period = props.period
      this.rptCtrlId = props.rptCtrlId
      this.logCtrlId = props.logCtrlId
    }
  }
}
