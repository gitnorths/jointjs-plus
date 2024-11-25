export class SettingControl {
  id!: string
  desc!: string
  numOfSGs!: number
  actSG = 1

  index!: number
  ldId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.desc = props.desc
      this.numOfSGs = props.numOfSGs
      this.actSG = props.actSG
      this.index = props.index
      this.ldId = props.ldId
    }
  }
}
