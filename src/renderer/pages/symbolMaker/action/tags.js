import store from '@/renderer/pages/symbolMaker/store'
import * as R from 'ramda'

export const lastSymbolTab = function () {
  store.commit('lastTab')
}

export const nextSymbolTab = function () {
  store.commit('nextTab')
}

export const closeSymbolAllTabs = function () {
  store.commit('closeTags', { curIndex: -1, direction: '' })
}

export const closeSymbolCurrentTab = function () {
  const activeIndex = store.getters.workTagsActiveIndex
  if (R.isNotNil(activeIndex)) {
    store.commit('closeTags', { curIndex: activeIndex, direction: '' })
  }
}

export const closeSymbolLeftTabs = function () {
  const activeIndex = store.getters.workTagsActiveIndex
  if (R.isNotNil(activeIndex)) {
    store.commit('closeTags', { curIndex: activeIndex, direction: 'l' })
  }
}

export const closeSymbolRightTabs = function () {
  const activeIndex = store.getters.workTagsActiveIndex
  if (R.isNotNil(activeIndex)) {
    store.commit('closeTags', { curIndex: activeIndex, direction: 'r' })
  }
}

export const closeSymbolOtherTabs = function () {
  const activeIndex = store.getters.workTagsActiveIndex
  if (R.isNotNil(activeIndex)) {
    store.commit('closeTags', { curIndex: activeIndex, direction: 'lr' })
  }
}
