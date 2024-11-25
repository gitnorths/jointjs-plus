import { TreeNode } from '@/model/dto/TreeNode'
import { DeviceConfig, SettingGroup } from '@/model/dto'

export class SettingGroupConfig extends TreeNode<DeviceConfig, any> {
  id = 'SettingGroupConfig'
  currentSection!: number // 当前定值区
  sectionNum!: number // 定值最大组号 32
  settingGroups!: SettingGroup[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.currentSection = props.currentSection
      this.sectionNum = props.sectionNum
    }
    this.settingGroups = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '定值配置'
  }

  initChildren () {
    this.children = this.settingGroups
  }
}
