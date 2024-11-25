export class ClientLN {
  id!: string
  iedName!: string
  ldInst!: string
  prefix!: string
  lnClass!: string
  lnInst!: string

  index!: number
  rptEnabledId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.iedName = props.iedName
      this.ldInst = props.ldInst
      this.prefix = props.prefix
      this.lnClass = props.lnClass
      this.lnInst = props.lnInst
      this.index = props.index
      this.rptEnabledId = props.rptEnabledId
    }
  }
}
