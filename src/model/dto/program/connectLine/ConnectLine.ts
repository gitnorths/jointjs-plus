import { ConnectLineRouterPoints } from '@/model/dto'
import { VariableTypeEnum, YesNoEnum } from '@/model/enum'

export class ConnectLine {
  id!: string
  headName!: string
  headType!: VariableTypeEnum
  headNodeId!: string
  headSignalId!: string
  headX!: number
  headY!: number
  tailName!: string
  tailType!: VariableTypeEnum
  tailNodeId!: string
  tailSignalId!: string
  tailX!: number
  tailY!: number
  breakCycle!: YesNoEnum // 通过线的样式代替破环符号
  label!: string // 拉线标签值
  routerPoints!: ConnectLineRouterPoints[]
  sAddr!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.headName = props.headName
      this.headType = props.headType
      this.headNodeId = props.headNodeId
      this.headSignalId = props.headSignalId
      this.headX = props.headX
      this.headY = props.headY
      this.tailName = props.tailName
      this.tailType = props.tailType
      this.tailNodeId = props.tailNodeId
      this.tailSignalId = props.tailSignalId
      this.tailX = props.tailX
      this.tailY = props.tailY
      this.breakCycle = props.breakCycle
      this.label = props.label
      this.sAddr = props.sAddr
    }
    this.routerPoints = []
  }
}
