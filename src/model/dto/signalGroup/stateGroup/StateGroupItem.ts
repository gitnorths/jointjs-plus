import { DbCatEnum, EnableStatusEnum, SignalClassifyEnum, YesNoEnum } from '@/model/enum'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
export class StateGroupItem {
  id!: string
  name!: string
  desc!: string
  abbr!: string // 词条
  index!: number
  t!: string // 时标
  q!: string // 品质
  evt!: YesNoEnum // 是否事件
  classify!: SignalClassifyEnum
  db_cat?: DbCatEnum // 变化死区类型
  norm!: string // 额定值
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
      this.evt = props.evt
      this.classify = props.classify
      this.db_cat = props.db_cat
      this.norm = props.norm
      this.status = props.status
      this.groupId = props.groupId
    }
  }
}
