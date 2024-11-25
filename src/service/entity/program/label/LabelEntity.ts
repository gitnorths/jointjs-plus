import { Column, PrimaryColumn } from 'typeorm'
import { VariableTypeEnum } from '@/model/enum'

export abstract class LabelEntity {
  @PrimaryColumn()
  id!: string

  @Column({ nullable: true })
  scope!: 'private' | 'public'

  @Column()
  name!: string

  @Column({ nullable: true })
  instName!: string

  @Column({ nullable: true })
  searchPath!: string

  @Column({ nullable: true })
  desc!: string

  @Column({ nullable: true })
  abbr!: string

  @Column({ nullable: true, type: 'numeric' })
  varType!: VariableTypeEnum

  @Column({ nullable: true })
  sAddr!: string

  @Column()
  x!: number

  @Column()
  y!: number

  @Column({ nullable: true })
  default!: string

  @Column({ nullable: true })
  value!: string

  protected constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.scope = props.scope
      this.name = props.name
      this.instName = props.instName
      this.searchPath = props.searchPath
      this.desc = props.desc
      this.abbr = props.abbr
      this.varType = props.varType
      this.sAddr = props.sAddr
      this.x = props.x
      this.y = props.y
      this.default = props.default
      this.value = props.value
    }
  }
}
