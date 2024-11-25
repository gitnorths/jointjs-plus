import { TreeNode } from '@/model/dto/TreeNode'
import {
  SymbolBlock,
  SymbolBlockVarInner,
  SymbolBlockVarInput,
  SymbolBlockVarOther,
  SymbolBlockVarOutput,
  SymbolBlockVarParam
} from '@/model/dto'

/**
 * 符号版本
 */
export class SymbolBlockVersion extends TreeNode<SymbolBlock, never> {
  pathId!: string
  name!: string
  version!: string
  desc!: string
  help!: string // 帮助信息
  index!: number

  inputs!: SymbolBlockVarInput[]
  outputs!: SymbolBlockVarOutput[]
  params!: SymbolBlockVarParam[]
  inners!: SymbolBlockVarInner[]
  others!: SymbolBlockVarOther[]

  modelFile: string | undefined
  graphicFile: string | undefined
  headFile: Buffer | undefined
  srcFile: Buffer | undefined
  libFile: Buffer | undefined

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.version = props.version
      this.desc = props.desc
      this.help = props.help
      this.index = props.index
      this.modelFile = props.modelFile
      this.graphicFile = props.graphicFile
      this.headFile = props.headFile
      this.srcFile = props.srcFile
      this.libFile = props.libFile
    }
    this.inputs = []
    this.outputs = []
    this.params = []
    this.inners = []
    this.others = []

    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = this.version
  }

  initChildren () {
    // no need to do
  }
}
