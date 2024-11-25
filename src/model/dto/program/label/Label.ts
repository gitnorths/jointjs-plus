import { VariableTypeEnum } from '@/model/enum'

export abstract class Label {
  id!: string
  scope!: 'private' | 'public'
  name!: string
  instName!: string
  searchPath!: string
  desc!: string
  abbr!: string
  varType!: VariableTypeEnum
  sAddr!: string
  x!: number
  y!: number
  default!: string
  value!: string
  pageId!: string

  protected constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.scope = props.scope
      this.name = props.name
      this.instName = props.instName
      this.searchPath = props.searchPath
      this.desc = props.desc
      this.abbr = props.abbr
      this.varType = props.varType
      this.sAddr = props.sAddr
      this.x = props.x
      this.y = props.y
      this.default = props.default
      this.value = props.value
      this.pageId = props.pageId
    }
  }
}
