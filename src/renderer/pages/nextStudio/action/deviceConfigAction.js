import { deleteModel, instanceModel, updateModel } from '@/renderer/pages/nextStudio/action/index'
import logger from '@/renderer/common/logger'
import { noNilAndEmptyRule } from '@/renderer/common/util'
import VBus from '@/renderer/common/vbus'
import { MessageBox } from 'element-ui'
import * as R from 'ramda'
import store from '@/renderer/pages/nextStudio/store'
import { YesNoEnum } from '@/model/enum'
// 新建管理组
export const createManageGroup = (node) => {
  const clazzName = node.clazzName.match(/(.+Group).*/)[1]
  const newObj = { clazzName }
  newObj.isManageGroup = YesNoEnum.YES
  VBus.$emit('OPEN_SIMPLE_DIALOG',
    newObj,
    '新建管理组',
    [
      {
        title: '组中文描述：',
        attr: 'cn',
        check: noNilAndEmptyRule('中文描述不能为空')
      },
      {
        title: '组英文描述：',
        attr: 'en',
        check: noNilAndEmptyRule('英文描述不能为空')
      }
    ],
    () => {
      return instanceModel(newObj, node.id)
        .then((newManageGroup) => {
          // FIXME
          newManageGroup.parent = node
          node.groupList.push(newManageGroup)
          node.children.push(newManageGroup)
          logger.info(`新建管理组"${newManageGroup.desc}"`)
        })
    })
}

// 新建子组
export const createSubGroup = (node) => {
  const clazzName = node.clazzName.match(/(.+Group).*/)[1]
  const newObj = { clazzName }
  newObj.isManageGroup = YesNoEnum.NO
  const callback = () => {
    return instanceModel(newObj, node.id).then((newGroup) => {
      newGroup.parentNode = node
      node.groupList.push(newGroup)
      node.children.push(newGroup)
      logger.info(`新建子组"${newGroup.desc}"`)
    })
  }
  if (R.equals('SettingGroup', clazzName)) {
    VBus.$emit('OPEN_SETTING_GROUP_DIALOG', newObj, false, true, callback)
  } else {
    VBus.$emit('OPEN_SIMPLE_DIALOG',
      newObj,
      '新建子组',
      [
        {
          title: '组中文描述：',
          attr: 'cn',
          check: noNilAndEmptyRule('中文描述不能为空')
        },
        {
          title: '组英文描述：',
          attr: 'en',
          check: noNilAndEmptyRule('英文描述不能为空')
        }
      ],
      callback)
  }
}

// 修改定值分组属性
export const changeAttrSettingGroup = (node) => {
  VBus.$emit('OPEN_SETTING_GROUP_DIALOG', node, true, false, () => {
    node.title = node.getTitle()
    return updateModel(node).then(() => {
      VBus.$emit('MODEL_UPDATE', [node])
    })
  })
}

export const setSetValueParam = (node) => {
  VBus.$emit('OPEN_SET_VALUE_MANAGER_DIALOG', node, () => {
    return updateModel(node)
  })
}

// 删除组
export const deleteGroup = (node) => {
  MessageBox.confirm(`此操作将永久删除 ${node.desc}, 是否继续?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    center: true
  })
    .then(() => {
      deleteModel(node)
        .then(() => {
          const memberArray = node.parentNode.groupList
          const toDelIndex = R.findIndex(R.propEq(node.id, 'id'), memberArray)
          memberArray.splice(toDelIndex, 1)
          if (node.parentNode.clazzName === 'BinaryGroupConfig') {
            node.parentNode.children.splice(toDelIndex + 1, 1)
          } else {
            node.parentNode.children.splice(toDelIndex, 1)
          }
          // 关闭tag页
          const childIdList = []
          findLeafGroup(childIdList, node)
          childIdList.forEach((id) => {
            // FIXME
            store.commit('closeTagByDtoId', { id, clazzName: node.clazzName, force: true })
          })

          VBus.$emit('MODEL_DELETE', [node])
          logger.info(`已删除 "${node.desc}" 组`)
        })
    })
}

const findLeafGroup = (childIdList, node) => {
  if (node.isManageGroup === YesNoEnum.NO) {
    childIdList.push(node.id)
  } else if (node.groupList && node.groupList.length > 0) {
    node.groupList.forEach((group) => {
      findLeafGroup(childIdList, group)
    })
  }
}
/**
 * 修改管理组属性
 * @param node
 */
export const manageGroupChangeAttr = (node) => {
  VBus.$emit('OPEN_SIMPLE_DIALOG',
    node,
    '修改属性',
    [
      {
        title: '组中文描述：',
        attr: 'cn',
        check: noNilAndEmptyRule('中文描述不能为空')
      },
      {
        title: '组英文描述：',
        attr: 'en',
        check: noNilAndEmptyRule('英文描述不能为空')
      }
    ],
    () => {
      node.title = node.getTitle()
      return updateModel(node).then(() => {
        VBus.$emit('MODEL_UPDATE', [node])
      })
    })
}

/**
 * 修改组的属性
 * @param node
 */
export const groupChangeAttr = (node) => {
  VBus.$emit('OPEN_SIMPLE_DIALOG',
    node,
    '修改属性',
    [
      {
        title: '组中文描述：',
        attr: 'cn',
        check: noNilAndEmptyRule('中文描述不能为空')
      },
      {
        title: '组英文描述：',
        attr: 'en',
        check: noNilAndEmptyRule('英文描述不能为空')
      },
      {
        title: '引用表：',
        attr: 'na',
        inputType: 'na'
      }
    ],
    () => {
      node.title = node.getTitle()
      return updateModel(node).then(() => {
        VBus.$emit('MODEL_UPDATE', [node])
      })
    })
}
