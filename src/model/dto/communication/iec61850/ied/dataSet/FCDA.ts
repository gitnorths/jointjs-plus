import { FCEnum } from '@/model/enum'

export class FCDA {
  id!: string
  ldInst!: string
  prefix!: string
  lnClass!: string
  lnInst!: string
  doName!: string
  daName!: string
  fc!: FCEnum
  sendq!: boolean
  sendt!: boolean

  index!: number
  dataSetId!: string
  lnId!: string
  daiId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id

      this.ldInst = props.ldInst
      this.prefix = props.prefix
      this.lnClass = props.lnClass
      this.lnInst = props.lnInst
      this.doName = props.doName
      this.daName = props.daName
      this.fc = props.fc
      this.index = props.index
      this.dataSetId = props.dataSetId
      this.lnId = props.lnId
      this.daiId = props.daiId
      this.sendq = props.sendq
      this.sendt = props.sendt
    }
  }
}
