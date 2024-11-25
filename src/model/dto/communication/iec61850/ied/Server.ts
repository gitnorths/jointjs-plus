import { Association, Authentication, LDevice } from '@/model/dto'

export class Server {
  id!: string
  timeout!: string
  authenticationList: Authentication[]
  associationList: Association[]
  ldList: LDevice[]

  constructor (props?: any) {
    if (props) {
      this.timeout = props.timeout
      this.id = props.id
    }
    this.authenticationList = []
    this.associationList = []
    this.ldList = []
  }
}
