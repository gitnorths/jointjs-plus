import { EnableStatusEnum, WaveAttrEnum, WaveLevelEnum, WavePriorityEnum, WaveTriggerTypeEnum } from '@/model/enum'

/**
 * 分组记录描述类
 * @param {string} id - 主键
 */
export class WaveGroupItem {
  id!: string
  name!: string
  desc!: string
  abbr!: string // 词条
  index!: number
  attr!: WaveAttrEnum // 分组类型
  level!: WaveLevelEnum // 通道等级 0-用户级 1-调试级 0
  amp!: string // 幅值
  priority!: WavePriorityEnum // 触发优先级 0-高 1-低 0
  mode!: WaveTriggerTypeEnum // 触发方式
  frontNum!: number // 故障前录波点数 0 - 120 0

  status!: EnableStatusEnum
  groupId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.abbr = props.abbr
      this.index = props.index
      this.attr = props.attr
      this.level = props.level
      this.amp = props.amp
      this.priority = props.priority
      this.mode = props.mode
      this.frontNum = props.frontNum
      this.status = props.status
      this.groupId = props.groupId
    }
  }
}
