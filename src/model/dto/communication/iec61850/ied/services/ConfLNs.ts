export class ConfLNs {
  id!: string
  type = 'ConfLNs'
  enable = false
  fixPrefix = false
  fixLnInst = true

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.fixPrefix = props.fixPrefix
      this.fixLnInst = props.fixLnInst
    }
  }
}
