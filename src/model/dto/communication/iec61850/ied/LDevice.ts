import {
  DataSet,
  GSEControl,
  Inputs,
  LN,
  LogControl,
  ReportControl,
  SampledValueControl,
  SCLControl,
  SettingControl
} from '@/model/dto'

export class LDevice {
  id!: string
  index!: number
  inst!: string
  name!: string
  desc!: string
  serverId!: string
  apId!: string
  lnList: LN[]// LNO LN
  // accessControl!: AccessControl;

  // 控制块和数据集挂载在LLN0下，建模时放到LD下面
  inputsList: Inputs[]
  dataSetList: DataSet[]
  rptCtrlList: ReportControl[]
  logCtrlList: LogControl[]
  gseCtrlList: GSEControl[]
  svCtrlList: SampledValueControl[]
  settingCtrlList: SettingControl[]
  sclCtrlList: SCLControl[]

  // log!: Log[] = [];

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.index = props.index
      this.inst = props.inst
      this.name = props.name
      this.desc = props.desc
      this.serverId = props.serverId
      this.apId = props.apId
    }
    this.lnList = []
    this.inputsList = []
    this.dataSetList = []
    this.rptCtrlList = []
    this.logCtrlList = []
    this.gseCtrlList = []
    this.svCtrlList = []
    this.settingCtrlList = []
    this.sclCtrlList = []
  }
}
