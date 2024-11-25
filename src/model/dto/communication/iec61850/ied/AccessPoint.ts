import { PhysConn, Server } from '@/model/dto'

export class AccessPoint {
  id!: string
  index!: number
  name!: string
  desc!: string
  router = false
  clock = false
  iedId!: string
  server!: Server
  physConnList: PhysConn[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.name = props.name
      this.desc = props.desc
      this.router = props.router
      this.clock = props.clock
      this.iedId = props.iedId
    }
    this.physConnList = []
  }
}
