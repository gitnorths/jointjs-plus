export class DynAssociation {
  id!: string
  type = 'DynAssociation'
  enable = false
  max = 0

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.max = props.max
    }
  }
}
