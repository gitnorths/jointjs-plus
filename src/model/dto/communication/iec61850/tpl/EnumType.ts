import { EnumVal } from '@/model/dto'

export class EnumType {
  id!: string
  enumValList!: EnumVal[]
  index!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
    }
    this.enumValList = []
  }
}
