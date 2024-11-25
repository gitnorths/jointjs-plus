import { getDtoClassName, getTagKey } from '@/renderer/common/util'
import * as R from 'ramda'
import { MessageBox } from 'element-ui'
import Vue from 'vue'
import { CLASS_VIEW_MAP } from '@/renderer/pages/nextStudio/views/components/workArea/workAreaConfig'
import { generateVarTree, saveDelta } from '@/renderer/pages/nextStudio/action'
import logger from '@/renderer/common/logger'
import notification from '@/renderer/common/notification'
import VBus from '@/renderer/common/vbus'

const workTagsStore = {
  state: {
    isSaving: false,
    delta: {},
    container: [],
    activeIndex: -1
  },
  getters: {
    dataContainer: (state) => {
      return state.container
    },
    activeIndex: (state) => {
      return state.activeIndex
    },
    activeDto: (state) => {
      return state.container[state.activeIndex]
    },
    activeKey: (state) => {
      return getTagKey(state.container[state.activeIndex])
    },
    selectDto: (state) => (key) => {
      return R.find(item => key === getTagKey(item))(state.container)
    },
    tagDeltaExist: (state) => (key) => {
      if (key) {
        const delta = state.delta[key]
        if (delta) {
          const { insertRecords, removeRecords, updateRecords } = delta
          return (R.isNotEmpty(insertRecords) || R.isNotEmpty(removeRecords) || R.isNotEmpty(updateRecords))
        }
        return false
      } else {
        let exist = false
        for (const delta of Object.values(state.delta)) {
          if (delta) {
            const { insertRecords, removeRecords, updateRecords } = delta
            if (R.isNotEmpty(insertRecords)) {
              exist = true
              break
            }
            if (R.isNotEmpty(removeRecords)) {
              exist = true
              break
            }
            if (R.isNotEmpty(updateRecords)) {
              exist = true
              break
            }
          }
        }
        return exist
      }
    }
  },
  mutations: {
    // 关闭所有标签页
    clearTags (state) {
      state.container = []
      state.activeIndex = -1
      state.delta = {}
    },
    addNodeToContainer (state, dto) {
      if (!dto) {
        return
      }
      if (!R.includes(getDtoClassName(dto))(Object.keys(CLASS_VIEW_MAP))) {
        return
      }

      const alreadyExist = R.findIndex((obj) => (dto.id === obj.id && getDtoClassName(dto) === getDtoClassName(obj)))(state.container)
      if (alreadyExist === -1) {
        state.container.push(dto)
        state.activeIndex = R.length(state.container) - 1
      } else {
        state.activeIndex = alreadyExist
      }
    },
    setActiveTagIndex (state, index) {
      state.activeIndex = index
    },
    sortTagContainer (state, tagsArray) {
      if (state.activeIndex > -1) {
        const orgActiveDto = state.container[state.activeIndex]
        state.activeIndex = R.findIndex(({ dto }) => dto === orgActiveDto)(tagsArray)
      }
      state.container.sort((a, b) => {
        const indexA = R.findIndex(({ dto }) => dto === a)(tagsArray)
        const indexB = R.findIndex(({ dto }) => dto === b)(tagsArray)
        return indexA - indexB
      })
    },
    // 上一标签页
    lastTab (state) {
      if (state.activeIndex > 0) {
        state.activeIndex -= 1
      }
    },
    // 下一标签页
    nextTab (state) {
      if (state.activeIndex < state.container.length - 1) {
        state.activeIndex += 1
      }
    },
    // 关闭标签
    closeTags (state, { curIndex, direction }) {
      let toCloseDtoArr
      if (curIndex < 0) {
        // curIndex -1 代表关闭所有
        toCloseDtoArr = [...state.container]
      } else {
        if (direction === 'l') {
          // direction 为l 代表关闭左侧
          toCloseDtoArr = state.container.filter((dto, index) => (index < curIndex))
        } else if (direction === 'r') {
          // direction 为l 代表关闭右侧
          toCloseDtoArr = state.container.filter((dto, index) => (index > curIndex))
        } else if (direction === 'lr') {
          // direction lr 代表关闭其他
          toCloseDtoArr = state.container.filter((dto, index) => (index !== curIndex))
        } else {
          // direction 没值 代表关当前
          toCloseDtoArr = state.container.filter((dto, index) => (index === curIndex))
        }
      }
      if (R.isEmpty(toCloseDtoArr)) {
        return
      }

      // 判断关闭页面是否有修改记录未保存
      const needSaveTitle = []
      for (const dto of toCloseDtoArr) {
        const delta = state.delta[getTagKey(dto)]
        if (delta && (R.isNotEmpty(delta.insertRecords) || R.isNotEmpty(delta.removeRecords) || R.isNotEmpty(delta.updateRecords))) {
          needSaveTitle.push(dto.title)
        }
      }

      const close = (toCloseDto) => {
        let tempIndex
        for (const dto of toCloseDto) {
          tempIndex = R.findIndex(R.propEq(dto.id, 'id'))(state.container)
          state.container.splice(tempIndex, 1)
          Vue.set(state.delta, getTagKey(dto), null)
        }
        state.activeIndex = tempIndex === state.container.length ? state.container.length - 1 : tempIndex
      }

      if (needSaveTitle.length > 0) {
        MessageBox.confirm(`此操作将丢失[${needSaveTitle.join(',')}]上所有未保存的内容，是否继续？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        }).then(() => {
          close(toCloseDtoArr)
        }).catch(() => {
          // nothing to do
        })
      } else {
        close(toCloseDtoArr)
      }
    },
    updateDelta (state, { key, delta }) {
      Vue.set(state.delta, key, delta)
    }
  },
  actions: {
    async saveAll ({ state }, fromCloseProject) {
      if (state.isSaving) {
        notification.openWarningNotification('频繁操作！请先等待上次保存请求执行结束后再试。')
        return
      }
      try {
        state.isSaving = true
        const allDelta = { insertRecords: [], updateRecords: [], removeRecords: [] }
        for (const delta of Object.values(state.delta)) {
          if (delta) {
            if (R.isNotEmpty(delta.insertRecords)) {
              delta.insertRecords.forEach((value) => allDelta.insertRecords.push(value))
            }
            if (R.isNotEmpty(delta.updateRecords)) {
              delta.updateRecords.forEach((value) => allDelta.updateRecords.push(value))
            }
            if (R.isNotEmpty(delta.removeRecords)) {
              delta.removeRecords.forEach((value) => allDelta.removeRecords.push(value))
            }
          }
        }
        if (R.isEmpty(allDelta.insertRecords) && R.isEmpty(allDelta.updateRecords) && R.isEmpty(allDelta.removeRecords)) {
          notification.openSuccessNotification('保存成功')
          return
        }
        await saveDelta(allDelta)
        notification.openSuccessNotification('保存成功').logger()
        for (const tagKey of Object.keys(state.delta)) {
          Vue.set(state.delta, tagKey, null)
        }
        if (!fromCloseProject) {
          generateVarTree()
          VBus.$emit('SAVE_SUCCEEDED')
        }
        if (R.isNotEmpty(allDelta.insertRecords)) {
          allDelta.insertRecords.forEach((value) => logger.info(`新建${value.clazzName} ${value.name || value.desc}`))
        }
        if (R.isNotEmpty(allDelta.updateRecords)) {
          allDelta.updateRecords.forEach((value) => logger.info(`修改${value.clazzName} ${value.name || value.desc}`))
        }
        if (R.isNotEmpty(allDelta.removeRecords)) {
          allDelta.removeRecords.forEach((value) => logger.info(`删除${value.clazzName} ${value.name || value.desc}`))
        }
      } catch (e) {
        notification.openErrorNotification(`保存失败：${e}`).logger()
        if (fromCloseProject) {
          throw e
        }
      } finally {
        state.isSaving = false
      }
    }
  }
}

export default workTagsStore
