import { EnableStatusEnum } from '@/model/enum'

export class SAddr {
  id!: string
  index!: number
  prefix!: string
  displayNa!: string
  na!: string
  boardType!: string
  position!: number // 0,1 单点都是0，双点有0有1
  desc!: string
  deadZone!: string
  zeroDrift!: string
  daiId!: string
  isInput = false
  isOutput = false
  isParam = false
  enabled = EnableStatusEnum.ON

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.prefix = props.prefix
      this.na = props.na
      this.displayNa = props.displayNa
      this.boardType = props.boardType
      this.position = props.position
      this.desc = props.desc
      this.deadZone = props.deadZone
      this.zeroDrift = props.zeroDrift
      this.daiId = props.daiId
      this.isInput = props.isInput
      this.isOutput = props.isOutput
      this.isParam = props.isParam
      this.enabled = props.enabled
    }
  }
}
