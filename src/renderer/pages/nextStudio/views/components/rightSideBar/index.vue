<template>
  <div style="width: 100%;height: 100%">
    <symbol-proto-list v-show="showSymbolProtoList"/>
    <output-variable-list v-show="showOutputVariableList"/>
    <param-variable-list v-show="showParamVariableList"/>
    <vfb-variable-list v-show="showVfbVariableList"/>
  </div>
</template>

<script>
import SymbolProtoList from './symbolList/symbolProtoList.vue'
import OutputVariableList from './variableList/outputVariableList.vue'
import ParamVariableList from './variableList/paramVariableList.vue'
import VfbVariableList from './variableList/vfbVariableList.vue'
import {
  ControlGroup,
  CustomGroup,
  EventInfoGroup,
  LDevice,
  Page,
  RecordGroup,
  ReportGroup,
  SettingGroup,
  StateGroup,
  WaveGroup
} from '@/model/dto'

export default {
  name: 'rightSideBar',
  components: {
    SymbolProtoList,
    VfbVariableList,
    ParamVariableList,
    OutputVariableList
  },
  computed: {
    activeKey () {
      return this.$store.getters.activeKey
    },
    activeDto () {
      return this.$store.getters.activeDto
    },
    showSymbolProtoList () {
      return this.activeDto instanceof Page
    },
    showOutputVariableList () {
      return this.activeDto instanceof StateGroup || this.activeDto instanceof RecordGroup || this.activeDto instanceof ReportGroup ||
        this.activeDto instanceof EventInfoGroup || this.activeDto instanceof CustomGroup || this.activeDto instanceof WaveGroup
    },
    showParamVariableList () {
      return this.activeDto instanceof SettingGroup
    },
    showVfbVariableList () {
      return this.activeDto instanceof ControlGroup
    },
    show61850VariableList () {
      return this.activeDto instanceof LDevice
    }
  }
}
</script>

<style scoped>

</style>
