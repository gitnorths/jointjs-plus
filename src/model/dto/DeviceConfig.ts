import { TreeNode } from '@/model/dto/TreeNode'
import { Device, HMIConfig, MacroDefine, SCL, SettingGroupConfig, SignalGroupConfig } from '@/model/dto'

export class DeviceConfig extends TreeNode<Device, any> {
  id = 'DeviceConfig'
  signalGroup!: SignalGroupConfig
  settingGroup!: SettingGroupConfig
  hmiConfig!: HMIConfig
  macroDefines!: MacroDefine[]
  scl!: SCL

  constructor (parent?: any) {
    super()
    this.macroDefines = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '配置'
  }

  initChildren () {
    this.children = []
    this.children.push(this.signalGroup)
    this.children.push(this.settingGroup)
    this.children.push(this.hmiConfig)
    // TODO 通信
  }
}
