import { GSETypeEnum } from '@/model/enum'

export class GSEControl {
  id!: string
  name!: string
  desc!: string
  datSet!: string
  confRev!: number
  type = GSETypeEnum.GOOSE
  appId!: string
  IEDName: string[]

  index!: number
  ldId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.datSet = props.datSet
      this.confRev = props.confRev
      this.type = props.type
      this.appId = props.appId
      this.index = props.index
      this.ldId = props.ldId
    }
    this.IEDName = []
  }
}
