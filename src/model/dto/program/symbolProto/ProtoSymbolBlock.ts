import { SymbolTypeEnum } from '@/model/enum'
import { TreeNode } from '@/model/dto/TreeNode'
import { ProtoSymbolLib } from '@/model/dto'

/**
 * 符号
 */
export class ProtoSymbolBlock extends TreeNode<ProtoSymbolLib, any> {
  pathId!: string
  name!: string // 忽略大小写
  version!: string // 忽略大小写
  desc!: string
  type!: SymbolTypeEnum // 符号类型
  help!: string
  model: string | undefined
  graphic: string | undefined
  index!: number
  pageId!: string

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.pathId = props.pathId
      this.name = props.name
      this.version = props.version
      this.desc = props.desc
      this.type = props.type
      this.help = props.help
      this.model = props.model
      this.graphic = props.graphic
      this.index = props.index
      this.pageId = props.pageId
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
