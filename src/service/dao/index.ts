import _ from 'lodash'
import { EntityManager, Repository } from 'typeorm'
import { EntityTarget } from 'typeorm/common/EntityTarget'

export class Dao<T> {
  private readonly dbRepository: Repository<T>

  constructor (target: EntityTarget<T>, entityManager: EntityManager) {
    this.dbRepository = entityManager.getRepository(target)
  }

  public async save (entity: T | T[]) {
    const toSaveEntity = _.cloneDeep(entity)
    if (_.isArray(toSaveEntity)) {
      const splitArr = _.chunk(toSaveEntity, 100)
      for (const arr of splitArr) {
        await this.dbRepository.insert(arr)
      }
      return
    }

    return await this.dbRepository.insert(toSaveEntity)
  }
}
