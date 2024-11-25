export class DO {
  name!: string
  type!: string
  desc!: string
  accessControl!: string
  transient = false

  constructor (props?: any) {
    if (props) {
      this.name = props.name
      this.type = props.type
      this.desc = props.desc || ''
      this.accessControl = props.accessControl
      this.transient = props.transient
    }
  }
}
