import { TreeNode } from '@/model/dto/TreeNode'
import { SymbolArchive, SymbolBlock } from '@/model/dto'

/**
 * 符号库
 */
export class SymbolLib extends TreeNode<SymbolArchive, SymbolBlock> {
  pathId!: string
  name!: string // 忽略大小写
  desc!: string
  index!: number

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.desc = props.desc
      this.index = props.index
    }
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = this.name
  }

  initChildren () {
    // no need to do
  }
}
