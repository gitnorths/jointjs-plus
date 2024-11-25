import { AccessPoint, SCL, Services } from '@/model/dto'
import { TreeNode } from '@/model/dto/TreeNode'

export class IED extends TreeNode<SCL, any> {
  id!: string
  name!: string
  index!: number
  desc!: string
  type!: string
  owner!: string
  manufacturer!: string
  configVersion!: string
  originalSclVersion!: string
  originalSclRevision!: string
  services!: Services
  icdName!: string // 代表的是icd配置的名字
  accessPointList: AccessPoint[]

  constructor (props?: any, parent?: any) {
    super()

    if (props) {
      this.id = props.id
      this.name = props.name || 'TEMPLATE'
      this.index = props.index
      this.desc = props.desc
      this.type = props.type
      this.owner = props.owner
      this.manufacturer = props.manufacturer
      this.configVersion = props.configVersion
      this.originalSclVersion = props.originalSclVersion
      this.originalSclRevision = props.originalSclRevision
      this.icdName = props.icdName
    }
    this.accessPointList = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = this.icdName || this.name
  }

  initChildren () {
    // no need to do
  }
}
