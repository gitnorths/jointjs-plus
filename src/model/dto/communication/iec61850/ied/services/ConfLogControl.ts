export class ConfLogControl {
  id!: string
  type = 'ConfLogControl'
  enable = false
  max!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.max = props.max
    }
  }
}
