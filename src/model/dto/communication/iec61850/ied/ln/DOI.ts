import { DAI, SDI } from '@/model/dto'

export class DOI {
  id!: string
  name!: string
  desc!: string
  ix!: string
  accessControl!: string
  cdc!: string
  sdiList: SDI[]
  daiList: DAI[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.ix = props.ix
      this.accessControl = props.accessControl
      this.cdc = props.cdc
    }
    this.sdiList = []
    this.daiList = []
  }
}
