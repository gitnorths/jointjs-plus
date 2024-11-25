import { SettingGroupItemMerge } from '@/model/dto'
import { EnableStatusEnum } from '@/model/enum'

export class SettingGroupItem {
  id!: string
  name!: string // 短地址
  status!: EnableStatusEnum
  desc!: string
  index!: number
  abbr!: string
  format!: string // 显示格式
  isBoot!: string // 是否修改后重启
  matrix!: string
  pMin!: string
  pMax!: string
  pNorm!: string
  sMin!: string
  sMax!: string
  sNorm!: string
  globalSetValue!: string
  multiSetValues!: string[]
  merges!: SettingGroupItemMerge[]
  groupId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.status = props.status
      this.desc = props.desc
      this.index = props.index
      this.abbr = props.abbr
      this.format = props.format
      this.isBoot = props.isBoot
      this.matrix = props.matrix
      this.pMin = props.pMin
      this.pMax = props.pMax
      this.pNorm = props.pNorm
      this.sMin = props.sMin
      this.sMax = props.sMax
      this.sNorm = props.sNorm
      this.globalSetValue = props.globalSetValue
      this.multiSetValues = props.multiSetValues
      this.groupId = props.groupId
    } else {
      this.multiSetValues = []
    }
    this.merges = []
  }
}
