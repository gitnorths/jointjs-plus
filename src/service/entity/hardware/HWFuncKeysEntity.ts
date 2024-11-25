import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { HWConfigEntity } from './HWConfigEntity'

@Entity('hmi_func_keys')
export class HWFuncKeysEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: 'close' | 'open' | 'lr' | 'login' | 'f1' | 'f2' | 'f3' | 'f4'

  @Column()
  desc!: '合闸' | '分闸' | '远程/本地切换' | '用户登录' | '功能按键1' | '功能按键2' | '功能按键3' | '功能按键4'

  @Column()
  action!: 'SW_CLOSE' | 'SW_OPEN' | 'LR_SW' | 'USER_LOGIN' | 'LANG_SW' | 'RESET_TARGET' | 'TIME_SYNC' |
    'LCD_OUT1' | 'LCD_OUT2' | 'LCD_OUT3' | 'LCD_OUT4' | 'OTHER_ID'

  @Column()
  actionDesc!: '合闸界面' | '分闸界面' | '远程/本地切换界面' | '跳转到登录界面' | '语言切换界面' | '信号复归界面' | '时间同步界面' |
    'LCD输出变量1' | 'LCD输出变量2' | 'LCD输出变量3' | 'LCD输出变量4' | '跳转到对应的界面'

  @Column({ nullable: true })
  way!: 'trigger' | 'counter' | 'cancel' // 只对 action = out1~4 有效, "trigger": 触发方式； "counter": 计数器模式; "cancel": 取消所有触发/计数器

  @Column({ nullable: true })
  mode!: number // "trigger": 触发方式下, 0: 表示上升触发； 1：表示下降触发; 不配置默认0.

  @Column({ nullable: true })
  high!: number // 高值, 取[0,65535]; 只对"trigger"方式有效; 不配置默认1.

  @Column({ nullable: true })
  low!: number // 低值, 取[0,65535]；只对"trigger"方式有效；不配置默认0.

  @Column({ nullable: true })
  st!: number // 计数器方式下，起始的数值, 取[0,65535], 不配置默认 0.

  @Column({ nullable: true })
  end!: number // 计数器方式下，结束的数值, 取[0,65535]， 不配置默认 65535.

  @Column({ nullable: true })
  step !: number // 计数器方式下，结束的数值, 取[0,65535]， 不配置默认 65535.

  @Column({ nullable: true })
  delay!: number // 对于触发方式，表示的是高低值的维持时间 [10, 60000]ms；对于计数器方式，表示的是数据变化的间隔时间, 如果不配置默认为10.

  @Column({ nullable: true })
  loop !: number // 触发次数, 表示的是脉冲触发次数或者计数器模式下循环的次数, 取[0,1000], 注意如果是0，表示无限循环, 如果不配置默认为1.

  @Column()
  index!: number

  @Column()
  hardwareId!: string

  @ManyToOne(() => HWConfigEntity, (hardware) => hardware.funcKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hardwareId' })
  hardware!: Relation<HWConfigEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.desc = props.desc
      this.action = props.action
      this.actionDesc = props.actionDesc
      this.way = props.way
      this.mode = props.mode
      this.high = props.high
      this.low = props.low
      this.st = props.st
      this.end = props.end
      this.step = props.step
      this.delay = props.delay
      this.loop = props.loop
      this.index = props.index
    }
    if (parent) {
      this.hardware = parent
      this.hardwareId = parent.id
    }
  }
}
