import Vue from 'vue'
import * as R from 'ramda'
import VBus from '@/renderer/common/vbus'

const DebugModeStore = {
  state: {
    debugMode: false,
    debugAddress: null,
    deviceConnecting: false,
    clientId: null,
    queryReq: null,
    timer: null,
    selectedMxCell: null,
    openedSignals: {},
    toCloseSignals: {},
    watchedSignals: [],
    watchedSignalsMap: {},
    debugBoardType: null,
    naPrefixMap: null,
    influxClient: null,
    recordStatus: false,
    countDown: 0
  },
  getters: {
    clientId: (state) => {
      return state.clientId
    },
    debugAddress: (state) => {
      return state.debugAddress
    },
    deviceConnecting: (state) => {
      return state.deviceConnecting
    },
    debugMode: (state) => {
      return state.debugMode
    },
    selectedMxCell: (state) => {
      return state.selectedMxCell
    },
    naPrefixMap: (state) => {
      return state.naPrefixMap
    },
    debugBoardType: (state) => {
      return state.debugBoardType
    },
    openedSignals: (state) => {
      return state.openedSignals
    },
    na2DebugSignal: (state) => (na) => {
      return state.openedSignals[na]
    },
    deviceNa2DebugSignal: (state) => (deviceNa) => {
      return R.find(R.propEq(deviceNa, 'deviceNa'))(Object.values(state.openedSignals))
    },
    deviceNa2CloseSignal: (state) => (deviceNa) => {
      return state.toCloseSignals[deviceNa]
    },
    watchedSignals: (state) => {
      return state.watchedSignals
    },
    na2WatchedSignals: (state) => (na) => {
      return state.watchedSignalsMap[na]
    },
    recordStatus: (state) => {
      return state.recordStatus
    },
    influxClient: (state) => {
      return state.influxClient
    },
    countDown: (state) => {
      return state.countDown
    }
  },
  mutations: {
    startDebugMode (state, { debugAddress, clientId, queryReq, timer }) {
      state.debugAddress = debugAddress
      state.clientId = clientId
      state.queryReq = queryReq
      if (state.timer) {
        clearInterval(state.timer)
      }
      state.timer = timer
      state.debugMode = true
    },
    setDebugBoardType (state, obj) {
      state.debugBoardType = { ...obj }
    },
    setNaPrefixMap (state, map) {
      state.naPrefixMap = map
    },
    setDeviceConnecting (state, deviceConnecting) {
      state.deviceConnecting = deviceConnecting
    },
    stopDebugMode (state) {
      clearInterval(state.timer)
      // 关闭套接字
      if (state.queryReq) {
        state.queryReq.disconnect(state.debugAddress)
        state.queryReq = null
      }
      // 清理已打开的信号
      state.openedSignals = {}
      state.selectedMxCell = null
      state.debugAddress = null
      state.clientId = null
      state.naPrefixMap = null
      state.watchedSignals = []
      state.watchedSignalsMap = {}
      state.debugMode = false
      state.influxClient = null
      state.recordStatus = false
      state.countDown = 0

      VBus.$emit('QUIT_DEBUG_MODE')
    },
    setSelectedMxCell (state, cell) {
      state.selectedMxCell = cell
    },
    addToOpenedSignals (state, signal) {
      Vue.set(state.openedSignals, signal.na, signal)
    },
    removeFromOpenedSignals (state, na) {
      Vue.delete(state.openedSignals, na)
    },
    addToCloseSignals (state, signal) {
      Vue.set(state.toCloseSignals, signal.deviceNa, signal)
    },
    removeFromCloseSignals (state, deviceNa) {
      Vue.delete(state.toCloseSignals, deviceNa)
    },
    addToWatchedSignals (state, payload) {
      const { na } = payload
      if (!state.watchedSignalsMap[na]) {
        const watchSignal = { ...payload }
        Vue.set(state.watchedSignals, state.watchedSignals.length, watchSignal)
        Vue.set(state.watchedSignalsMap, na, watchSignal)
      }
    },
    removeFromWatchedSignals (state, na) {
      const index = R.findIndex(R.propEq(na, 'na'), state.watchedSignals)
      Vue.delete(state.watchedSignals, index)
      Vue.delete(state.watchedSignalsMap, na)
    },
    setWatchedSignals (state, watchedSignals) {
      state.watchedSignals = watchedSignals
      state.watchedSignalsMap = {}
      for (const sig of watchedSignals) {
        Vue.set(state.watchedSignalsMap, sig.na, sig)
      }
    },
    setInfluxClient (state, influxClient) {
      state.influxClient = influxClient
    },
    setRecordStatus (state, recordStatus) {
      state.recordStatus = recordStatus
    },
    setRecordCountDown (state, countDown) {
      state.countDown = countDown
    }
  },
  actions: {}
}

export default DebugModeStore
