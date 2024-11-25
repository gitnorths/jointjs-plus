import { DOI } from '@/model/dto'

export class LN {
  id!: string
  name!: string
  index!: number
  desc!: string
  lnType!: string
  lnClass!: string
  prefix!: string
  inst!: string
  ldId!: string
  doiList: DOI[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.desc = props.desc
      this.lnType = props.lnType
      this.lnClass = props.lnClass
      this.prefix = props.prefix
      this.inst = props.inst
      this.ldId = props.ldId
      this.name = this.getName()
    }
    this.doiList = []
  }

  getName () {
    return `${this.lnClass}${this.inst || ''}`
  }
}
