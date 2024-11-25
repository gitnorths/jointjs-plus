import { EnableStatusEnum } from '@/model/enum'

export class SettingGroupItemMerge {
  id!: string
  name!: string // 短地址
  status!: EnableStatusEnum
  index!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.status = props.status
      this.index = props.index
    }
  }
}
