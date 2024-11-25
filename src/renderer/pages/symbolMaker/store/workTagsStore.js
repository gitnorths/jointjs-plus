import { getDtoClassName, getWorkTagKey } from '@/renderer/common/util'
import * as R from 'ramda'
import { MessageBox } from 'element-ui'
import Vue from 'vue'
import { CLASS_VIEW_MAP } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'
import notification from '@/renderer/common/notification'
import logger from '@/renderer/common/logger'
import VBus from '@/renderer/common/vbus'
import { SymbolMakerService } from '@/service/SymbolMakerService'

const workTagsStore = {
  state: {
    isSaving: false,
    delta: {},
    container: [],
    activeIndex: -1
  },
  getters: {
    seDelta: (state) => {
      return state.delta
    },
    workTagsContainer: (state) => {
      return state.container
    },
    workTagsActiveIndex: (state) => {
      return state.activeIndex
    },
    workTagsActiveDTO: (state) => {
      return state.container[state.activeIndex]
    },
    workTagsActiveKey: (state) => {
      return getWorkTagKey(state.container[state.activeIndex])
    },
    workTagsSelectDto: (state) => (key) => {
      return R.find((item) => key === getWorkTagKey(item))(state.container)
    },
    seTagDeltaExist: (state) => (key) => {
      if (key) {
        const delta = state.delta[key]
        if (delta) {
          const { basicInfo, inputs, outputs, params, customTypeOptList, graph } = delta
          return (basicInfo || inputs || outputs || params || customTypeOptList || graph)
        }
        return false
      } else {
        let exist = false
        for (const delta of Object.values(state.delta)) {
          if (delta) {
            const { basicInfo, inputs, outputs, params, customTypeOptList, graph } = delta
            if (basicInfo || inputs || outputs || params || customTypeOptList || graph) {
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
    clearWorkTagStore (state) {
      state.container = []
      state.activeIndex = -1
      state.delta = {}
    },
    addNodeToWorkTagsContainer (state, dto) {
      if (!dto) {
        return
      }
      if (!R.includes(getDtoClassName(dto))(Object.keys(CLASS_VIEW_MAP))) {
        return
      }

      const alreadyExist = R.findIndex((obj) => (dto.pathId === obj.pathId && getDtoClassName(dto) === getDtoClassName(obj)))(state.container)
      if (alreadyExist === -1) {
        state.container.push(dto)
        state.activeIndex = R.length(state.container) - 1
      } else {
        state.activeIndex = alreadyExist
      }
    },
    setWorkTagsActiveIndex (state, index) {
      state.activeIndex = index
    },
    sortWorkTagsContainer (state, tagsArray) {
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
        const delta = state.delta[getWorkTagKey(dto)]
        if (delta && (delta.basicInfo || delta.inputs || delta.outputs || delta.params || delta.customTypeOptList || delta.graphic)) {
          needSaveTitle.push(dto.title)
        }
      }

      const close = (toCloseDto) => {
        let tempIndex
        for (const dto of toCloseDto) {
          const tempIndex = R.findIndex(R.propEq(dto.pathId, 'pathId'))(state.container)
          state.container.splice(tempIndex, 1)
          Vue.set(state.delta, getWorkTagKey(dto), null)
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
    updateSEDelta (state, { key, propName, value }) {
      const delta = state.delta[key] || {}
      Vue.set(delta, propName, value)
      Vue.set(state.delta, key, delta)
    }
  },
  actions: {
    // FIXME
    saveAll ({ state }, fromCloseProject) {
      if (state.isSaving) {
        notification.openWarningNotification('频繁操作！请先等待上次保存请求执行结束后再试。')
        return
      }
      try {
        state.isSaving = true
        const allDelta = []
        if (R.isEmpty(allDelta)) {
          notification.openSuccessNotification('保存成功')
          return
        }
        SymbolMakerService.save()
        notification.openSuccessNotification('保存成功')
        state.delta = {}
        VBus.$emit('RELOAD_SYMBOL_BLOCK_VERSION')
        logger.info(`${allDelta.map(dto => dto.name).join(', ')}保存成功`)
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
