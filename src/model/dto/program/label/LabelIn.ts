import { Label } from './Label'

export class LabelIn extends Label {
  pathId = 'base/extend/labelin/1.0'
  type!: 'RegInput' | 'PageInput' | 'BoardInput'

  constructor (props?: any) {
    super(props)
    if (props) {
      this.type = props.type
    }
  }
}
