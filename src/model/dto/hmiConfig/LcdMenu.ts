import { LcdAuthEnum, YesNoEnum } from '@/model/enum'
import { LcdMenuRefData } from '@/model/dto'

export class LcdMenu {
  id!: string
  name!: string
  abbr!: string
  func!: string
  auth!: LcdAuthEnum
  ps !: number // 页面一二次值显示属性，可选配置；不配置页面根据一二次值显示定值自动切换显示，配置为0显示一次值，配置为1显示二次值。
  isFolder!: YesNoEnum
  index!: number
  parentMenuId!: string
  menus!: LcdMenu[]
  refDatas!: LcdMenuRefData[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.abbr = props.abbr
      this.func = props.func
      this.auth = props.auth
      this.ps = props.ps
      this.isFolder = props.isFolder
      this.parentMenuId = props.parentMenuId
      this.index = props.index
    }
    this.menus = []
    this.refDatas = []
  }
}
