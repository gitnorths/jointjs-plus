export class PageAnnotation {
  id!: string
  value!: string
  x!: number
  y!: number
  width!: number
  height!: number
  color!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.value = props.value
      this.x = props.x
      this.y = props.y
      this.width = props.width
      this.height = props.height
      this.color = props.color
    }
  }
}
