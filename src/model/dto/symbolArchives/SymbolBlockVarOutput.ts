import { SymbolBlockVar } from './SymbolBlockVar'

export class SymbolBlockVarOutput extends SymbolBlockVar {
  value!: string // 设置值
  isShowGraph!: string // 是否在图上显示

  constructor (props?: any) {
    super(props)
    if (props) {
      this.value = props.value
      this.isShowGraph = props.isShowGraph
    }
  }
}
