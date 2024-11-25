import { TreeNode } from '@/model/dto/TreeNode'
import { HMIConfig, WaveInst } from '@/model/dto'

export class WaveGroupConfig extends TreeNode<HMIConfig, WaveInst> {
  id = 'WaveGroupConfig'
  insts: WaveInst[]

  constructor (parent?: any) {
    super()
    this.insts = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '研发录波配置'
  }

  initChildren () {
    this.children = this.insts
  }
}
