export class ConfDataSet {
  id!: string
  type = 'ConfDataSet'
  enable = false
  max!: number
  maxAttributes!: number
  modify = true
  fccb = false

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.max = props.max
      this.maxAttributes = props.maxAttributes
      this.modify = props.modify
      this.fccb = props.fccb
    }
  }
}
