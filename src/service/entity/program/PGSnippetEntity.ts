import { Column, Entity, OneToMany, PrimaryColumn, Relation } from 'typeorm'
import { PageEntity } from './PageEntity'

/**
 * 进程实体类
 * @param {string} id - 数据库id，uuid
 * @param {string} name - 片段名 （组合符号库名称）
 * @param {number} index - 下标
 * @param {Array.<PageEntity>} pages - 程序页面列表
 * @constructor
 */
@Entity('pg_snippet')
export class PGSnippetEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column()
  index!: number

  @OneToMany(() => PageEntity, page => page.snippet)
  pages!: Relation<PageEntity>[]

  constructor (props?: any) {
    if (props) {
      this.id = props.id
      this.name = props.name
      this.index = props.index
    }
  }
}
