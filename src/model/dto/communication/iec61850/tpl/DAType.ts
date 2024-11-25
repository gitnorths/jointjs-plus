import { BDA } from '@/model/dto'

export class DAType {
  id!: string
  desc!: string
  iedType!: string
  bdaList!: BDA[]
  index!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.iedType = props.iedType || ''
    }
    this.bdaList = []
  }
}
