import { TreeNode } from '@/model/dto/TreeNode'
import { DeviceConfig, LcdMenuConfig, WaveGroupConfig } from '@/model/dto'

export class HMIConfig extends TreeNode<DeviceConfig, any> {
  id = 'HMIConfig'
  lcdMenu!: LcdMenuConfig
  waveConfig!: WaveGroupConfig

  constructor (parent?: any) {
    super()
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = 'HMI配置'
  }

  initChildren () {
    this.children = []
    this.children.push(this.lcdMenu)
    this.children.push(this.waveConfig)
  }
}
