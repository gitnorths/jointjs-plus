import { VariableTypeEnum } from '@/model/enum'

export class LinkDotInst {
  id!: string
  x!: number
  y!: number
  varType!: VariableTypeEnum

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.x = props.x
      this.y = props.y
      this.varType = props.varType
    }
  }
}
