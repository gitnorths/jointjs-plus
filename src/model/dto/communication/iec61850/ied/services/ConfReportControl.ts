export class ConfReportControl {
  id!: string
  type = 'ConfReportControl'
  enable = false
  max!: number
  bufMode!: number
  bufConf

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.max = props.max
      this.bufMode = props.bufMode
      this.bufConf = props.bufConf
    }
  }
}
