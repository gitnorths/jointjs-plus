import { WaveFrequencyTypeEnum } from '@/model/enum'

export class WaveFrequencyItem {
  id!: string
  desc!: string
  num!: number // 记录点数 1
  type!: WaveFrequencyTypeEnum // 记录数据类型 INSTANT
  value!: number
  index!: number

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.num = props.num
      this.type = props.type
      this.value = props.value
      this.index = props.index
    }
  }
}
