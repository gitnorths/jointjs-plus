import { WaveConfig, WaveGroup, WaveGroupConfig } from '@/model/dto'
import { TreeNode } from '@/model/dto/TreeNode'

export class WaveInst extends TreeNode<WaveGroupConfig, any> {
  id!: string
  name!: string
  desc!: string
  custom!: number
  inst!: number
  waveConfig!: WaveConfig
  waveGroups!: WaveGroup[]

  constructor (props?: any, parent?: any) {
    super()
    this.waveGroups = []
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.custom = props.custom
      this.inst = props.inst
    }
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = this.name
  }

  initChildren () {
    this.children = this.waveGroups
  }
}
