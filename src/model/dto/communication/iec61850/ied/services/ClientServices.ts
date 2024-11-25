export class ClientServices {
  id!: string
  type = 'ClientServices'
  enable = false
  goose = false
  gsse = false
  bufReport = false
  unbufReport = false
  readLog = false
  sv = false
  fccb = false

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.goose = props.goose
      this.gsse = props.gsse
      this.bufReport = props.bufReport
      this.unbufReport = props.unbufReport
      this.readLog = props.readLog
      this.sv = props.sv
      this.fccb = props.fccb
    }
  }
}
