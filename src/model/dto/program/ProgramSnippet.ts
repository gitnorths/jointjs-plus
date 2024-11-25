import { TreeNode } from '@/model/dto/TreeNode'
import { PGSnippet, ProgramConfig } from '@/model/dto'

export class ProgramSnippet extends TreeNode<ProgramConfig, PGSnippet> {
  id = 'ProgramSnippet'
  snippets!: PGSnippet[]

  constructor (parent?: any) {
    super()
    this.snippets = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '程序片段 Snippets' // FIXME i18n
  }

  initChildren () {
    this.children = this.snippets
  }
}
