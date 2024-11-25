import { SmvOpts } from '@/model/dto'

export class SampledValueControl {
  id!: string
  name!: string
  desc!: string
  datSet!: string
  confRev!: number
  smvID!: string
  multicast = true
  smpRate!: number
  nofASDU!: number
  IEDName: string[]
  smvOpts!: SmvOpts

  index!: number
  ldId!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.datSet = props.datSet
      this.confRev = props.confRev
      this.smvID = props.smvID
      this.multicast = props.multicast
      this.smpRate = props.smpRate
      this.nofASDU = props.nofASDU
      this.index = props.index
      this.ldId = props.ldId
    }
    this.IEDName = []
  }
}
