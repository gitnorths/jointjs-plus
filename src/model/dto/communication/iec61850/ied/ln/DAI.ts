import { SAddr } from '@/model/dto'
import { BTypeEnum, FCEnum, ValKindEnum } from '@/model/enum'

export class DAI {
  id!: string
  name!: string
  desc!: string
  signalDesc!: string
  sAddr: SAddr[]
  bType!: BTypeEnum
  valKind!: ValKindEnum
  type!: string
  fc!: FCEnum
  value!: string
  ix!: string
  na!: string
  doiId!: string
  sdiId!: string
  sendq!: boolean
  sendt!: boolean
  sAddrEditEnable!: boolean
  valueEditEnable!: boolean

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.signalDesc = props.signalDesc
      this.bType = props.bType
      this.valKind = props.valKind
      this.type = props.type
      this.fc = props.fc
      this.value = props.value
      this.ix = props.ix
      this.na = props.na
      this.doiId = props.doiId
      this.sdiId = props.sdiId
      this.sendq = props.sendq
      this.sendt = props.sendt
    }
    this.sAddr = []
  }
}
