import { TreeNode } from '@/model/dto/TreeNode'
import { Device, ProgramBoard, ProgramSnippet } from '@/model/dto'
import * as R from 'ramda'
import { BoardAbilityEnum } from '@/model/enum'

export class ProgramConfig extends TreeNode<Device, ProgramSnippet | ProgramBoard> {
  id = 'ProgramConfig'
  snippet!: ProgramSnippet
  optBoards!: ProgramBoard[]

  constructor (parent?: any) {
    super()
    this.optBoards = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '软件' // FIXME i18n
  }

  initChildren () {
    this.children = []
    this.children.push(this.snippet)
    if (R.isNotEmpty(this.optBoards)) {
      for (const treeNode of this.optBoards) {
        // TODO 过滤
        if (treeNode.ability !== BoardAbilityEnum.COM && treeNode.ability !== BoardAbilityEnum.PWR) {
          this.children.push(treeNode)
        }
      }
    }
  }
}
