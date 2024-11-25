import { DA, SDO } from '@/model/dto'

export class DOType {
  id!: string
  desc!: string
  iedType!: string
  cdc!: string
  sdoList!: SDO[]
  daList!: DA[]
  index!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.iedType = props.iedType || ''
      this.cdc = props.cdc
    }
    this.sdoList = []
    this.daList = []
  }
}
