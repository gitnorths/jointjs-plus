import { deleteModel, getObjContext, instanceModel, updateModel } from '@/renderer/pages/nextStudio/action/station'
import notification from '@/renderer/common/notification'
import { getTagKey } from '@/renderer/common/util'
import VBus from '@/renderer/common/vbus'
import { MessageBox } from 'element-ui'
import * as R from 'ramda'
import store from '@/renderer/pages/nextStudio/store'
import { EnableStatusEnum } from '@/model/enum'
import { generateVarTree } from '@/renderer/pages/nextStudio/action/index'
import { Page } from '@/model/dto'

export const deleteProgramBoard = (node) => {
  MessageBox.confirm(`此操作将永久删除 ${node.title} 可选板卡, 是否继续?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    center: true
  })
    .then(() => {
      deleteModel(node)
        .then(() => {
          const tagKeys = []
          // FIXME 删除板卡需要关闭关联页面，刷新变量库
          node.cpus.forEach(cpu => {
            cpu.cores.forEach(core => {
              if (R.isNotEmpty(core.processes)) {
                core.processes.forEach((proc) => {
                  if (R.isNotEmpty(proc.pageList)) {
                    proc.pageList.forEach((page) => {
                      tagKeys.push(getTagKey(page))
                      const index = R.findIndex((obj) => obj instanceof Page && obj.id === page.id)(store.getters.workTagsContainer)
                      this.$store.commit('closeTags', { curIndex: index, direction: '' })
                    })
                  }
                })
              }
            })
          })
          const boardList = node.parentNode.boards
          const toDelIndex = R.findIndex(R.propEq(node.id, 'id'), boardList)
          boardList.splice(toDelIndex, 1)
          const delTreeIndex = R.findIndex(R.propEq(node.id, 'id'), node.parentNode.children)
          node.parentNode.children.splice(delTreeIndex, 1)

          VBus.$emit('REFRESH_WORK_AREA', tagKeys)
          VBus.$emit('board-deleted')

          notification.openInfoNotification(`成功删除板卡"${node.title}"`).logger()
          generateVarTree()
        })
        .catch((e) => {
          notification.openErrorNotification(`删除板卡"${node.title}失败，${e}"`).logger()
        })
    })
    .catch((e) => {
      notification.openInfoNotification(`已取消删除 ${e}`)
    })
}

export const showTaskLevel = (node) => {
  VBus.$emit('SHOW_TASK_LEVEL_SCHEDULE_MODAL', node)
}
export const createProcess = (node) => {
  VBus.$emit('OPEN_PROCESS_ATTR_DIALOG', node, true)
}

export const updateProcess = (node) => {
  VBus.$emit('OPEN_PROCESS_ATTR_DIALOG', node, false)
}
export const deleteProcess = (node) => {
  MessageBox.confirm(`此操作将永久删除 ${node.title} 进程, 是否继续?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    center: true
  })
    .then(() => {
      deleteModel(node)
        .then(() => {
          const tagKeys = []
          // FIXME 删除进程需要关闭关联页面，刷新变量库
          if (R.isNotEmpty(node.pageList)) {
            node.pageList.forEach((page) => {
              if (page) {
                tagKeys.push(getTagKey(page))
                store.commit('closeTagByDtoId', { id: page.id, clazzName: 'PageGraph', force: true })
              }
            })
          }
          // 从processes和children中移除process节点
          const processList = node.parentNode.processes
          const delIndex = R.findIndex(R.propEq(node.id, 'id'), processList)
          processList.splice(delIndex, 1)
          node.parentNode.children.splice(delIndex, 1)

          VBus.$emit('REFRESH_WORK_AREA', tagKeys)
          notification.openInfoNotification(`成功删除进程"${node.title}"`).logger()

          generateVarTree()
        })
        .catch((e) => {
          notification.openErrorNotification(`删除进程"${node.title}失败，${e}"`).logger()
        })
    })
    .catch((e) => {
      notification.openInfoNotification(`已取消删除 ${e}`)
    })
}

export const createPage = (node) => {
  VBus.$emit('OPEN_PAGE_ATTR_DIALOG',
    { clazzName: 'PageGraph' },
    true,
    (obj) => {
      obj.pageNum = `${node.pageList.length}`
      return instanceModel(obj, node.id)
        .then((newPage) => {
          newPage.parentNode = node
          newPage.title = newPage.name
          node.pageList.push(newPage)
          node.children.push(newPage)
          notification.openSuccessNotification(`新建页面"${newPage.name}"`).logger()
          VBus.$emit('CLOSE_PAGE_ATTR_DIALOG')
        })
        .catch((e) => {
          notification.openErrorNotification(`新建页面"${obj.name}失败，${e}"`).logger()
        })
    })
}

export const updatePage = (node) => {
  VBus.$emit('OPEN_PAGE_ATTR_DIALOG',
    node,
    false,
    (obj) => {
      return updateModel(obj)
        .then(() => {
          if (node.level !== obj.level) {
            VBus.$emit('PAGE_LEVEL_CHANGED', node)
          }
          if (node.status !== obj.status) {
            VBus.$emit('REFRESH_WORK_AREA')
          }
          node.name = obj.name
          node.title = node.name
          node.pageInfo = obj.pageInfo
          node.level = obj.level
          node.status = obj.status
          node.visible = obj.visible
          notification.openSuccessNotification(`修改页面"${node.name}"成功`).logger()
          VBus.$emit('CLOSE_PAGE_ATTR_DIALOG')
        })
        .catch((e) => {
          notification.openErrorNotification(`修改页面"${node.name}失败，${e}"`).logger()
        })
    })
}

export const copyPage = async (node) => {
  if (node.clazzName !== 'PageGraph') {
    return
  }
  const pageChanged = store.getters.tagDeltaExist(getTagKey(node))
  if (pageChanged) {
    notification.openWarningNotification(`页面复制失败！当前页面${node.name}存在未保存的修改。请先保存`).logger()
    return
  }
  const page = await getObjContext(node)
  // fixme
  const existDirtyVfbList = R.filter(R.propEq(EnableStatusEnum.DIRTY, 'status'))(page.vfbList)
  if (existDirtyVfbList && R.isNotEmpty(existDirtyVfbList)) {
    notification.openWarningNotification(`页面复制失败！页面包含失效的功能块实例：[ ${existDirtyVfbList.map(vfb => vfb.instName).join(',')} ]`).logger()
    return
  }
  VBus.$emit('COPY_PAGE', page)
}

export const pastePage = () => {
  VBus.$emit('PASTE_PAGE')
}

export const deletePage = (node) => {
  MessageBox.confirm(`此操作将永久删除 ${node.title} 页面, 是否继续?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    center: true
  })
    .then(() => {
      deleteModel(node)
        .then(() => {
          const pageList = node.parentNode.pageList
          const indexInPageList = R.findIndex(R.equals(node), pageList)
          pageList.splice(indexInPageList, 1)
          node.parentNode.children.splice(indexInPageList, 1)
          // 删除页面需要关闭关联页面，刷新变量库
          store.commit('closeTagByDtoId', { id: node.id, clazzName: 'PageGraph', force: true })
          VBus.$emit('REFRESH_WORK_AREA', [getTagKey(node)])
          notification.openSuccessNotification(`已删除 "${node.title}" 页面`).logger()
          generateVarTree()
        })
        .catch((e) => {
          notification.openErrorNotification(`页面删除"${node.name}失败，${e}"`).logger()
        })
    })
    .catch((e) => {
      notification.openInfoNotification(`已取消删除 ${e}`)
    })
}

// 添加页脚
export const addPageFooter = async (node) => {
  VBus.$emit('ADD_PAGE_FOOTER', node)
}

// 删除页脚
export const deletePageFooter = async (node) => {
  VBus.$emit('DEL_PAGE_FOOTER', node)
}
