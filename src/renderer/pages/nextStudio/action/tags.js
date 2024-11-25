import store from '@/renderer/pages/nextStudio/store'
import * as R from 'ramda'

export const lastTab = function () {
  store.commit('lastTab')
}

export const nextTab = function () {
  store.commit('nextTab')
}

export const closeAllTabs = function () {
  store.commit('closeTags', { curIndex: -1, direction: '' })
}
export const closeTab = function () {
  const activeIndex = store.getters.activeIndex
  if (R.isNotNil(activeIndex)) {
    store.commit('closeTags', { curIndex: activeIndex, direction: '' })
  }
}

export const closeLeftTabs = function () {
  const activeIndex = store.getters.activeIndex
  if (R.isNotNil(activeIndex)) {
    store.commit('closeTags', { curIndex: activeIndex, direction: 'l' })
  }
}

export const closeRightTabs = function () {
  const activeIndex = store.getters.activeIndex
  if (R.isNotNil(activeIndex)) {
    store.commit('closeTags', { curIndex: activeIndex, direction: 'r' })
  }
}

export const closeOtherTabs = function () {
  const activeIndex = store.getters.activeIndex
  if (R.isNotNil(activeIndex)) {
    store.commit('closeTags', { curIndex: activeIndex, direction: 'lr' })
  }
}
