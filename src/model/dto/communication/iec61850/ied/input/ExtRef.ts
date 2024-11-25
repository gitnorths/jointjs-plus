export class ExtRef {
  id!: string
  iedName!: string
  ldInst!: string
  prefix!: string
  lnClass!: string
  lnInst!: string
  doName!: string
  daName!: string
  intAddr!: string

  index!: string
  inputId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id

      this.iedName = props.iedName
      this.ldInst = props.ldInst
      this.prefix = props.prefix
      this.lnClass = props.lnClass
      this.lnInst = props.lnInst
      this.doName = props.doName
      this.daName = props.daName
      this.intAddr = props.intAddr
      this.index = props.index
      this.inputId = props.inputId
    }
  }
}
