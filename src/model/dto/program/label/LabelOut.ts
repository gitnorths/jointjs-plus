import { Label } from './Label'

export class LabelOut extends Label {
  pathId = 'base/extend/labelout/1.0'
  type!: 'RegOutput' | 'RegDebugOutput' | 'PageOutput' | 'BoardOutput'

  constructor (props?: any) {
    super(props)
    if (props) {
      this.type = props.type
    }
  }
}
