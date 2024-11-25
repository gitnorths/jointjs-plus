import { BoardAbilityEnum, YesNoEnum } from '@/model/enum'

/**
 * 插槽类.
 * @param {string} id - 数据库主键
 * @param {number} slot - 板卡槽号
 * @param {string} type - 当前板卡类型
 * @param {BoardAbilityEnum} ability - 当前板卡能力
 * @param {string} sn - 当前板卡MOT编码
 * @param {string} desc - 描述
 * @param {number} optional - 是否可选板卡
 * @param {Array.<BoardAbilityEnum>} slotAbilityList - 插槽能力
 * @param {Array.<string>} optTypeList - 可选板卡列表
 * @constructor
 */
export class MainBoardSlotConfig {
  id!: string
  slot!: number
  type!: string
  ability!: BoardAbilityEnum
  sn!: string
  desc!: string
  optional!: YesNoEnum
  slotAbilityList!: BoardAbilityEnum[]
  optTypeList!: string[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.slot = props.slot
      this.type = props.type
      this.ability = props.ability
      this.sn = props.sn
      this.desc = props.desc
      this.optional = props.optional
      this.slotAbilityList = props.slotAbilityList || []
      this.optTypeList = props.optTypeList || []
    }
  }
}
