import { EnableStatusEnum, SignalClassifyEnum, TripTypeEnum } from '@/model/enum'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
export class ReportGroupItem {
  id!: string
  name!: string
  desc!: string
  abbr!: string // 词条
  index!: number
  t!: string // 时标
  q!: string // 品质
  tripType!: TripTypeEnum // 动作类型
  param!: string // 参数
  classify!: SignalClassifyEnum // 词条
  status!: EnableStatusEnum
  groupId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.abbr = props.abbr
      this.index = props.index
      this.t = props.t
      this.q = props.q
      this.tripType = props.tripType
      this.param = props.param
      this.classify = props.classify
      this.status = props.status
      this.groupId = props.groupId
    }
  }
}
