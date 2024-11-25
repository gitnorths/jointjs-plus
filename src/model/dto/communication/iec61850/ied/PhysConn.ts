export class PhysConn {
  id!: string
  physConnType!: string
  port!: string
  plug!: string
  type!: string
  cable!: number
  index!: number
  apId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.physConnType = props.physConnType
      this.port = props.port
      this.plug = props.plug
      this.type = props.type
      this.cable = props.cable
      this.index = props.index
      this.apId = props.apId
    }
  }
}
