export class SmvOpts {
  id!: string
  refreshTime = false
  sampleSynchronized = false
  sampleRate = false
  security = false
  dataRef = false

  svCtrlId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.refreshTime = props.refreshTime
      this.sampleSynchronized = props.sampleSynchronized
      this.sampleRate = props.sampleRate
      this.security = props.security
      this.dataRef = props.dataRef
      this.svCtrlId = props.svCtrlId
    }
  }
}
