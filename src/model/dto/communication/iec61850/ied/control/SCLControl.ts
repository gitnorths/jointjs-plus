export class SCLControl {
  id!: string
  desc!: string

  index!: number
  ldId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.index = props.index
      this.ldId = props.ldId
    }
  }
}
