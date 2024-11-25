import { TreeNode } from '@/model/dto/TreeNode'
import { SymbolLib } from '@/model/dto'

/**
 * 符号库
 */
export class SymbolArchive extends TreeNode<never, SymbolLib> {
  pathId!: string
  name!: string // 忽略大小写
  desc!: string
  organization!: string // 中研院平台、思宏瑞、清能等等
  toolVersion!: string // 工具版本

  // 辅助信息
  dbPath!: string // db文件路径

  constructor (props?: any) {
    super()
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.desc = props.desc
      this.organization = props.organization
      this.toolVersion = props.toolVersion
      this.dbPath = props.dbPath
    }
    this.setTitle()
  }

  setTitle () {
    this.title = this.name
  }

  initChildren () {
    // no need to do
  }
}
