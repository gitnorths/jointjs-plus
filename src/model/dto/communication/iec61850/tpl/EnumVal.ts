export class EnumVal {
  ord!: number
  desc!: string

  constructor (props?: any) {
    if (props) {
      this.ord = Number(props.ord)
      this.desc = props.desc
    }
  }
}
