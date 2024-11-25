import { FCDA } from '@/model/dto'

export class DataSet {
  id!: string
  name!: string
  desc!: string
  fcdaList: FCDA[]

  index!: number
  ldId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.index = props.index
      this.ldId = props.ldId
    }
    this.fcdaList = []
  }
}
