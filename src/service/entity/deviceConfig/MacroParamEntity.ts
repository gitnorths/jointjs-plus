import { Column, Entity, PrimaryColumn } from 'typeorm'

/**
 * 宏参数实体类
 * @param {string} id - 数据库id
 * @param {string} name - 宏定义名称
 * @param {string} value - 宏定义值
 * @param {string} desc - 宏定义描述
 * @constructor
 */

@Entity('macro_param')
export class MacroParamEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column({ nullable: true })
  value!: string

  @Column({ nullable: true })
  desc!: string

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.value = props.value
      this.desc = props.desc
    }
  }
}
