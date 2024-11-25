import store from '@/renderer/pages/symbolMaker/store'
import notification from '@/renderer/common/notification'
import * as R from 'ramda'
import { MessageBox } from 'element-ui'
import { openWindowLoading } from '@/renderer/common/action'
import { clearRecentAction } from '@/renderer/pages/symbolMaker/action/appAction'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { SymbolArchive, SymbolBlock, SymbolBlockVersion, SymbolLib } from '@/model/dto'

// 删除节点
export const deleteNode = async ({ node, data }) => {
  const parentData = data.parent ? data.parent : null

  let loading
  try {
    await MessageBox.confirm(
      `此操作将删除 ${data.name}, 所有未保存的操作都将丢失，是否继续?`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

    loading = openWindowLoading('删除中...')
    // 关闭已经打开的tag
    const closeDtos = store.getters.workTagsContainer.map(dto => dto.pathId.startsWith(data.pathId))
    closeDtos.forEach(dto => {
      const index = R.findIndex(R.propEq(dto.pathId, 'pathId'))(store.getters.workTagsContainer)
      store.commit('closeTags', { curIndex: index, direction: '' })
    })

    if (data instanceof SymbolArchive) {
      //  删除打开历史记录请刷新menu
      clearRecentAction(data.dbPath)
      // 更新树展开节点列表
      store.commit('removeArchiveFromStore', data)
      await DataSourceManager.closeDataSource(data.name)
    } else if (data instanceof SymbolLib) {
      // 删除符号库
      // 更新树展开节点列表
      if (parentData) {
        parentData.children.splice(R.findIndex(R.propEq(data.pathId, 'pathId'))(parentData.children), 1)
      }
      // TODO 更新index
    } else if (data instanceof SymbolBlock) {
      // 删除符号块
      // 更新树展开节点列表
      if (parentData) {
        parentData.children.splice(R.findIndex(R.propEq(data.pathId, 'pathId'))(parentData.children), 1)
      }
      // TODO 更新index
    } else if (data instanceof SymbolBlockVersion) {
      // 删除版本
      // 更新树展开节点列表
      if (parentData) {
        parentData.children.splice(R.findIndex(R.propEq(data.pathId, 'pathId'))(parentData.children), 1)
      }
      // TODO 更新index
    }
    notification.openSuccessNotification('删除成功').logger()
  } catch (action) {
    if (action !== 'cancel') {
      notification.openErrorNotification(`删除出错，${action}`).logger()
      throw action
    }
  } finally {
    if (loading) {
      loading.close()
    }
  }
}
