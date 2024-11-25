export class Authentication {
  id!: string
  none = true
  password = false
  weak = false
  strong = false
  certificate = false

  index!: number
  serverId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.none = props.none
      this.password = props.password
      this.weak = props.weak
      this.strong = props.strong
      this.certificate = props.certificate
      this.index = props.index
      this.serverId = props.serverId
    }
  }
}
