import { WaveFrequencyItem } from '@/model/dto'

export class WaveConfig {
  id!: string
  maxItemNum!: number // 最大保存整组数
  minItemNum!: number // 低优先级保留的条目数
  maxRecordNum!: number // 录波的最大录波点数
  frequencies!: WaveFrequencyItem[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.maxItemNum = props.maxItemNum
      this.minItemNum = props.minItemNum
      this.maxRecordNum = props.maxRecordNum
    }
    this.frequencies = []
  }
}
