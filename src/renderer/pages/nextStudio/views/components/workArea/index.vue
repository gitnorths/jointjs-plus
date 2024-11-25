<template>
  <div class="window_work_area">
    <hardware-view v-if="selectedType === viewConst.DEV_MAIN_BOARD_VIEW" :tag-key="tagKey"/>
    <graph-editor v-if="selectedType === viewConst.GRAPH_EDITOR_VIEW" :tag-key="tagKey"/>
    <state-group-view v-if="selectedType === viewConst.STATE_GROUP_VIEW" :tag-key="tagKey"/>
    <control-group-view v-if="selectedType === viewConst.CONTROL_GROUP_VIEW" :tag-key="tagKey"/>
    <record-group-view v-if="selectedType === viewConst.RECORD_GROUP_VIEW" :tag-key="tagKey"/>
    <report-group-view v-if="selectedType === viewConst.REPORT_GROUP_VIEW" :tag-key="tagKey"/>
    <event-info-group-view v-if="selectedType === viewConst.EVENT_INFO_GROUP_VIEW" :tag-key="tagKey"/>
    <setting-group-view v-if="selectedType === viewConst.SETTING_GROUP_VIEW" :tag-key="tagKey"/>
    <lcd-drag-menu v-if="selectedType === viewConst.LCD_MENU_VIEW" :tag-key="tagKey"/>
    <wave-config-view v-if="selectedType === viewConst.WAVE_CONFIG_VIEW" :tag-key="tagKey"/>
    <wave-group-view v-if="selectedType === viewConst.WAVE_GROUP_VIEW" :tag-key="tagKey"/>
  </div>
</template>

<script>
import * as R from 'ramda'
import * as workAreaView from './workAreaConfig'
import HardwareView from './hardwareInfoView/hardwareView.vue'
import GraphEditor from './graphEditorView/graphEditor.vue'
import LcdDragMenu from './lcdMenuView/lcdDragMenu.vue'
import StateGroupView from './signalGroupView/stateGroupView.vue'
import ControlGroupView from './signalGroupView/controlGroupView.vue'
import RecordGroupView from './signalGroupView/recordGroupView.vue'
import ReportGroupView from './signalGroupView/reportGroupView.vue'
import EventInfoGroupView from './signalGroupView/eventInfoGroupView.vue'
import SettingGroupView from './settingGroupView.vue'
import WaveGroupView from './waveView/waveGroupView.vue'
import WaveConfigView from './waveView/waveConfigView.vue'

export default {
  name: 'windowWorkArea',
  components: {
    HardwareView,
    GraphEditor,
    StateGroupView,
    ControlGroupView,
    RecordGroupView,
    ReportGroupView,
    EventInfoGroupView,
    SettingGroupView,
    LcdDragMenu,
    WaveGroupView,
    WaveConfigView
  },
  props: {
    tagKey: {
      type: String,
      required: true
    }
  },
  computed: {
    viewConst () {
      return workAreaView
    },
    selectedType () {
      const clazzName = R.head(this.tagKey.split('-'))
      return this.viewConst.CLASS_VIEW_MAP[clazzName]
    }
  }
}
</script>

<style scoped>
.window_work_area {
  height: 100%;
  width: 100%;
}
</style>
