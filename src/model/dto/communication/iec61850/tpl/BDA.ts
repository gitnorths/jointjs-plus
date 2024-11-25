import { BTypeEnum, ValKindEnum } from '@/model/enum'

export class BDA {
  name!: string
  desc!: string
  sAddr!: string
  bType!: BTypeEnum
  valKind!: ValKindEnum
  type!: string
  count!: number
  value!: string

  constructor (props?: any) {
    if (props) {
      this.name = props.name
      this.desc = props.desc
      this.sAddr = props.sAddr
      this.bType = props.bType
      this.valKind = props.valKind
      this.type = props.type
      this.count = props.count
      this.value = props.value
    }
  }
}
