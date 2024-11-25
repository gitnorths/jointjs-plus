import { TreeNode } from '@/model/dto/TreeNode'
import { ControlGroup, DeviceConfig, EventInfoGroup, RecordGroup, ReportGroup, StateGroup } from '@/model/dto'

export class SignalGroupConfig extends TreeNode<DeviceConfig, any> {
  id = 'SignalGroupConfig'

  stateGroup!: StateGroup
  controlGroup!: ControlGroup
  recordGroup!: RecordGroup
  reportGroup!: ReportGroup
  eventGroup!: EventInfoGroup

  constructor (parent?: any) {
    super()
    this.parent = parent
    this.setTitle()
  }

  setTitle () {
    this.title = '信号分组'
  }

  initChildren () {
    this.children = []
    this.children.push(this.stateGroup)
    this.children.push(this.controlGroup)
    this.children.push(this.recordGroup)
    this.children.push(this.reportGroup)
    this.children.push(this.eventGroup)
  }
}
