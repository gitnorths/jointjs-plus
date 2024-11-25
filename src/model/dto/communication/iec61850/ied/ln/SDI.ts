import { DAI } from '@/model/dto'

export class SDI {
  id!: string
  name!: string
  desc!: string
  ix!: string
  doiId!: string
  sdiId!: string
  sdiList: SDI[]
  daiList: DAI[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.ix = props.ix
      this.doiId = props.doiId
      this.sdiId = props.sdiId
    }
    this.sdiList = []
    this.daiList = []
  }
}
