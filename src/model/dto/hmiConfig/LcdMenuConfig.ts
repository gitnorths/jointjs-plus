import { TreeNode } from '@/model/dto/TreeNode'
import { HMIConfig, LcdMenu } from '@/model/dto'

export class LcdMenuConfig extends TreeNode<HMIConfig, any> {
  id = 'LcdMenuConfig'
  menus: LcdMenu[]

  constructor (parent?: any) {
    super()
    this.menus = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = 'LCD菜单'
  }

  initChildren () {
    // no need to do
  }
}
