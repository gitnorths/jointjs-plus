import Vue from 'vue'
import * as path from 'path'
import { DEVICE_FILE_EXT_NAME } from '@/util/consts'

const DeviceStore = {
  state: {
    deviceDbPath: null, // 工程路径
    device: null,
    symbolProtoLoading: false,
    archiveProtoList: [],
    symbolNameSpace: {},
    symbolProtoMap: {},
    dataType: null,
    kemaType: null,
    cdcFilter: null,
    rackLib: null,
    boardLib: null
  },
  getters: {
    device: (state) => {
      return state.device
    },
    deviceDbPath: (state) => {
      return state.deviceDbPath
    },
    deviceDbName: (state) => {
      return state.deviceDbPath ? path.basename(state.deviceDbPath, DEVICE_FILE_EXT_NAME) : ''
    },
    symbolProtoLoading: (state) => {
      return state.symbolProtoLoading
    },
    archiveProtoList: (state) => {
      return state.archiveProtoList
    },
    symbolNameSpace: (state) => {
      return state.symbolNameSpace
    },
    symbolProtoMap: (state) => {
      return state.symbolProtoMap
    },
    dataType: (state) => {
      return state.dataType
    },
    kemaType: (state) => {
      return state.kemaType
    },
    cdcFilter: (state) => {
      return state.cdcFilter
    },
    rackLib: (state) => {
      return state.rackLib
    },
    boardLib: (state) => {
      return state.boardLib
    }
  },
  mutations: {
    setDeviceDbPath (state, deviceDbPath) {
      state.deviceDbPath = deviceDbPath
    },
    setDevice (state, device) {
      state.device = device
    },
    setSymbolProtoLoading (state, value) {
      state.symbolProtoLoading = value
    },
    setArchiveProtos (state, archiveProtoList) {
      state.archiveProtoList = archiveProtoList
    },
    setSymbolNameSpace (state, symbolNameSpace) {
      state.symbolNameSpace = symbolNameSpace
    },
    addSymbolProtoToMap (state, symbolBlockProto) {
      Vue.set(state.symbolProtoMap, symbolBlockProto.pathId, symbolBlockProto)
    },
    clearSymbolProtoMap (state) {
      state.symbolProtoMap = {}
    },
    setTplDataType (state, dataType) {
      state.dataType = dataType
    },
    setTplKEMAType (state, kemaType) {
      state.kemaType = kemaType
    },
    setCdcFilter (state, cdcFilter) {
      state.cdcFilter = cdcFilter
    },
    setBoardLib (state, boardLib) {
      state.boardLib = boardLib
    },
    setRackLib (state, rackLib) {
      state.rackLib = rackLib
    }
  },
  actions: {}
}

export default DeviceStore
