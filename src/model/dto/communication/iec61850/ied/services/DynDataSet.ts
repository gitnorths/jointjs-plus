export class DynDataSet {
  id!: string
  type = 'DynDataSet'
  enable = false
  max!: number
  maxAttributes!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.max = props.max
      this.maxAttributes = props.maxAttributes
    }
  }
}
