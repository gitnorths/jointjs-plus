import { WaveGroupItem, WaveInst } from '@/model/dto'
import { TreeNode } from '@/model/dto/TreeNode'

export class WaveGroup extends TreeNode<WaveInst, any> {
  id!: string
  name!: 'STATE_TABLE' | 'ANALOG_TABLE' | 'TRIG_TABLE' | 'REPORT_TABLE'
  desc!: '开关量通道' | '模拟量通道' | '录波触发信号' | '整组报告'
  index!: number // 排序
  attrFilter!: string[]

  items!: WaveGroupItem[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.index = props.index
      this.attrFilter = props.attrFilter
    } else {
      this.attrFilter = []
    }
    this.items = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `${this.desc} ${this.name}`
  }

  initChildren () {
    // no need
  }
}
