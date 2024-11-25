import { LEDColorEnum, LEDTypeEnum, YesNoEnum } from '@/model/enum'

export class LEDConfigItem {
  id!: string
  name!: string
  index!: number
  bayNo!: number
  boardNo!: number
  color!: LEDColorEnum
  enable!: YesNoEnum // 是否使能
  flicker!: YesNoEnum // 是否闪烁
  keep!: YesNoEnum // 是否保持
  type!: LEDTypeEnum

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.index = props.index
      this.bayNo = props.bayNo
      this.boardNo = props.boardNo
      this.color = props.color
      this.enable = props.enable
      this.flicker = props.flicker
      this.keep = props.keep
      this.type = props.type
    }
  }
}
