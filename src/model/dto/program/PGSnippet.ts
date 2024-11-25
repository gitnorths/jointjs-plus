import { TreeNode } from '@/model/dto/TreeNode'
import { Page, ProgramSnippet } from '@/model/dto'

/**
 * 进程实体类
 * @param {string} id - 数据库id
 * @param {string} name - 片段名 （组合符号库名称）
 * @param {number} index - 下标
 * @constructor
 */
export class PGSnippet extends TreeNode<ProgramSnippet, Page> {
  id!: string
  name!: string
  index!: number
  pages!: Page[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.name = props.name
      this.index = props.index
    }
    this.pages = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = this.name
  }

  initChildren () {
    this.children = this.pages
  }
}
