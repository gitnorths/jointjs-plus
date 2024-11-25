import { TreeNode } from '@/model/dto/TreeNode'
import { DeviceConfig, IED } from '@/model/dto'

export class SCL extends TreeNode<DeviceConfig, IED> {
  id = 'SCL'
  header!: any
  communication!: any
  version!: '1.0' | '2.0'
  iedList: IED[]

  constructor (props?: any, parent?: DeviceConfig) {
    super()
    if (props) {
      this.header = props.header
      this.communication = props.communication
      this.version = props.version
    }
    this.iedList = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = 'IEC61850'
  }

  initChildren () {
    this.children = this.iedList
  }
}
