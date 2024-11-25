import { ISymbolBlockVarInst } from './ISymbolBlockVarInst'

export class SymbolBlockVarInputInst extends ISymbolBlockVarInst {
  value!: string // 设置值

  constructor (props?: any) {
    super(props)
    if (props) {
      this.value = props.value
    }
  }
}
