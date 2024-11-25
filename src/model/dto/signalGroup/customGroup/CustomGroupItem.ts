import { EnableStatusEnum, SignalClassifyEnum } from '@/model/enum'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
export class CustomGroupItem {
  id!: string
  name!: string
  desc!: string
  abbr!: string // 词条
  index!: number
  classify!: SignalClassifyEnum
  status!: EnableStatusEnum
  groupId!: string
  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.abbr = props.abbr
      this.index = props.index
      this.classify = props.classify
      this.status = props.status
      this.groupId = props.groupId
    }
  }
}
