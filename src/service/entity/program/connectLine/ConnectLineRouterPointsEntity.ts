import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { ConnectLineEntity } from './ConnectLineEntity'

@Entity('pg_connect_line_router_point')
export class ConnectLineRouterPointsEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  x!: number

  @Column()
  y!: number

  @Column()
  index!: number

  @Column()
  connectLineId!: string

  @ManyToOne(() => ConnectLineEntity, cLine => cLine.routerPoints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connectLineId' })
  connectLine!: Relation<ConnectLineEntity>

  constructor (props?: any, parent?: any) {
    if (props) {
      this.id = props.id
      this.x = props.x
      this.y = props.y
      this.index = props.index
    }
    if (parent) {
      this.connectLine = parent
      this.connectLineId = parent.id
    }
  }
}
