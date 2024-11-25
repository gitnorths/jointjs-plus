export class OptFields {
  id!: string
  seqNum = false
  timeStamp = false
  dataSet = false
  reasonCode = false
  dataRef = false
  bufOvfl = true
  entryID = false
  configRef = false
  segmentation = false
  rptCtrlId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.seqNum = props.seqNum
      this.timeStamp = props.timeStamp
      this.dataSet = props.dataSet
      this.reasonCode = props.reasonCode
      this.dataRef = props.dataRef
      this.bufOvfl = props.bufOvfl
      this.entryID = props.entryID
      this.configRef = props.configRef
      this.segmentation = props.segmentation
      this.rptCtrlId = props.rptCtrlId
    }
  }
}
