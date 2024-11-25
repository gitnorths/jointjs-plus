export class ConnectLineRouterPoints {
  id!: string
  x!: number
  y!: number
  index!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.x = props.x
      this.y = props.y
      this.index = props.index
    }
  }
}
