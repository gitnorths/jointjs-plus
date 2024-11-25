export class Association {
  id!: string
  kind!: string // pre-established  predefined
  associationID!: string
  iedName!: string
  ldInst!: string
  lnClass!: string
  prefix!: string
  lnInst!: string

  index!: number
  serverId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.kind = props.kind
      this.associationID = props.associationID
      this.iedName = props.iedName
      this.ldInst = props.ldInst
      this.lnClass = props.lnClass
      this.prefix = props.prefix
      this.lnInst = props.lnInst
      this.index = props.index
      this.serverId = props.serverId
    }
  }
}
