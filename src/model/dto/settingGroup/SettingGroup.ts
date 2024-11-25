import { SettingGroupConfig, SettingGroupItem } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'
import { TreeNode } from '@/model/dto/TreeNode'

export class SettingGroup extends TreeNode<SettingGroupConfig | SettingGroup, SettingGroup> {
  id!: string
  name!: string
  desc!: string
  reserved!:YesNoEnum // 是否是预定义的分组
  isFolder!: YesNoEnum
  lcdModify!: YesNoEnum // 是否允许HMI整定 1
  multiSet!: YesNoEnum // 是否支持多区 0-否 1-是
  reboot!: YesNoEnum // 是否重启 0-不重启 1-重启DSP 2-重启装置
  remoteModify!: YesNoEnum // 禁止远方修改 0
  index!: number // 排序

  items!: SettingGroupItem[]
  childGroups!: SettingGroup[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.reserved = props.reserved
      this.isFolder = props.isFolder
      this.lcdModify = props.lcdModify
      this.multiSet = props.multiSet
      this.reboot = props.reboot
      this.remoteModify = props.remoteModify
      this.index = props.index
    }

    this.childGroups = []
    this.items = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `${this.desc} ${this.name}`
  }

  initChildren () {
    this.children = this.childGroups
  }
}
