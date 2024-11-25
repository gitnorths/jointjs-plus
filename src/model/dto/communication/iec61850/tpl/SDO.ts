export class SDO {
  name!: string
  desc!: string
  type!: string

  constructor (props?: any) {
    if (props) {
      this.name = props.name
      this.desc = props.desc
      this.type = props.type
    }
  }
}
