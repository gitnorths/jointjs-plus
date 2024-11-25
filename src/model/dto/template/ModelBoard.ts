import { BoardAbilityEnum } from '@/model/enum'

export class ModelBoard {
  name!: string // 板卡型号
  sn!: string // MOT编码
  desc!: string // 描述
  ability!: BoardAbilityEnum
  cpuCoreNums!: number

  // TODO sg port是什么？
  constructor (props?: any) {
    if (props) {
      this.name = props.name
      this.sn = props.sn
      this.desc = props.desc
      this.ability = props.ability
      this.cpuCoreNums = props.cpuCoreNums
    }
  }
}
