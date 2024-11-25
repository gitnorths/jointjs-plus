import { BTypeEnum, FCEnum, ValKindEnum } from '@/model/enum'

export class DA {
  name!: string
  desc!: string
  sAddr!: string
  bType!: BTypeEnum
  valKind!: ValKindEnum
  type!: string
  dchg = false
  qchg = false
  dupd = false
  fc!: FCEnum
  value!: string

  constructor (props?: any) {
    if (props) {
      this.name = props.name
      this.desc = props.desc
      this.sAddr = props.sAddr
      this.bType = props.bType
      this.valKind = props.valKind
      this.type = props.type
      this.dchg = props.dchg
      this.qchg = props.qchg
      this.dupd = props.dupd
      this.fc = props.fc
      this.value = props.value
    }
  }
}
