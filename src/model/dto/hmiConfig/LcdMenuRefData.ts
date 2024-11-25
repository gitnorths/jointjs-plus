export class LcdMenuRefData {
  id!: string
  name!: string
  abbr!: string
  desc!: string
  t!: string
  q!: string
  index!: number
  setAttr!: string // 定值属性，可选配置（只针对高性能项目）；定值类条目需要配置此属性，配置为0数据默认显示，配置为1数据只在内部调试模式显示。
  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.abbr = props.abbr
      this.desc = props.desc
      this.t = props.t
      this.q = props.q
      this.index = props.index
      this.setAttr = props.setAttr
    }
  }
}
