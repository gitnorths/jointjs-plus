import { ClientLN } from '@/model/dto'

export class RptEnabled {
  id!: string
  desc!: string
  max = 1
  clientLNList: ClientLN[]
  rptCtrlId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.max = props.max
      this.rptCtrlId = props.rptCtrlId
    }
    this.clientLNList = []
  }
}
