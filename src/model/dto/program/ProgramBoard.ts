import { TreeNode } from '@/model/dto/TreeNode'
import { CpuCoreInfo, ProgramConfig } from '@/model/dto'
import { format10 } from '@/util'
import { BoardAbilityEnum, getBoardAbilityEnumString } from '@/model/enum'

export class ProgramBoard extends TreeNode<ProgramConfig, CpuCoreInfo> {
  id!: string
  slot!: number
  type!: string
  ability!: BoardAbilityEnum
  desc!: string
  cpuCores!: CpuCoreInfo[]

  constructor (props?: any, parent?: any) {
    super()
    if (props) {
      this.id = props.id
      this.slot = props.slot
      this.type = props.type
      this.ability = props.ability
      this.desc = props.desc
    }
    this.cpuCores = []
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = `[B${format10(this.slot)}] ${this.type} : ${getBoardAbilityEnumString(this.ability)}`
  }

  initChildren () {
    this.children = this.cpuCores
  }
}
