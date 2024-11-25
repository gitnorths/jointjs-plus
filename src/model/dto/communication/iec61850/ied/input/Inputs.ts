import { ExtRef } from '@/model/dto'

export class Inputs {
  id!: string
  desc!: string
  extRefList: ExtRef[]

  index!: string
  ldId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.index = props.index
      this.ldId = props.ldId
    }
    this.extRefList = []
  }
}
