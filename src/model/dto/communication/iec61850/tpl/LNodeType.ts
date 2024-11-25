import { DO } from '@/model/dto'

export class LNodeType {
  id!: string
  lnClass!: string
  desc!: string
  iedType!: string
  doList!: DO[]
  index!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.lnClass = props.lnClass
      this.desc = props.desc || ''
      this.iedType = props.iedType
    }
    this.doList = []
  }
}
