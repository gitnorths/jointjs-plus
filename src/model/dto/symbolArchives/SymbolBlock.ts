import { SymbolTypeEnum } from '@/model/enum'
import { TreeNode } from '@/model/dto/TreeNode'
import { SymbolBlockVersion, SymbolLib } from '@/model/dto'

/**
 * 符号
 */
export class SymbolBlock extends TreeNode<SymbolLib, SymbolBlockVersion> {
  pathId!: string
  name!: string // 忽略大小写
  desc!: string
  type!: SymbolTypeEnum // 符号类型
  latest!: string // 记录最新版本
  index!: number
  allVersions!: string[] // 记录所有归档的版本

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.desc = props.desc
      this.type = props.type
      this.latest = props.latest
      this.index = props.index
      this.allVersions = props.allVersions
    } else {
      this.allVersions = []
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
