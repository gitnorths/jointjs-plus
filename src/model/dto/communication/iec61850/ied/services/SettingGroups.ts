export class SettingGroups {
  id!: string
  type = 'SettingGroups'
  enable = false
  sgEdit = false
  confSG = false

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.type = props.type
      this.enable = props.enable
      this.sgEdit = props.sgEdit
      this.confSG = props.confSG
    }
  }
}
