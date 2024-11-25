import { EnableStatusEnum, SymbolTypeEnum, YesNoEnum } from '@/model/enum'
import {
  SymbolBlockVarInnerInst,
  SymbolBlockVarInputInst,
  SymbolBlockVarOtherInst,
  SymbolBlockVarOutputInst,
  SymbolBlockVarParamInst
} from '@/model/dto'

export class SymbolBlockInst {
  id!: string
  desc!: string
  instName!: string
  orderInPage!: number
  status!: EnableStatusEnum
  sAddr!: string
  name!: string
  pathId!: string
  searchPath!: string
  type!: SymbolTypeEnum
  help!: any
  orgDesc!: string
  abbr!: string

  showInstName!: YesNoEnum
  x!: number
  y!: number

  inputs!: SymbolBlockVarInputInst[]
  outputs!: SymbolBlockVarOutputInst[]
  params!: SymbolBlockVarParamInst[]
  inners!: SymbolBlockVarInnerInst[]
  others!: SymbolBlockVarOtherInst[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.instName = props.instName
      this.orderInPage = props.orderInPage
      this.status = props.status
      this.sAddr = props.sAddr
      this.name = props.name
      this.pathId = props.pathId
      this.searchPath = props.searchPath
      this.type = props.type
      this.help = props.help
      this.orgDesc = props.orgDesc
      this.abbr = props.abbr
      this.showInstName = props.showInstName ? 1 : 0
      this.x = props.x
      this.y = props.y
    }
    this.inputs = []
    this.outputs = []
    this.params = []
    this.inners = []
    this.others = []
  }
}
