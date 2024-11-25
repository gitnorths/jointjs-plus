import { SymbolBlockVar } from './SymbolBlockVar'

export class SymbolBlockVarParam extends SymbolBlockVar {
  value!: string // 设置值

  constructor (props?: any) {
    super(props)
    if (props) {
      this.value = props.value
    }
  }
}
