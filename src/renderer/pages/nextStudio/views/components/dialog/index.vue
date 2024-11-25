<template>
  <div>
    <import-plsym-dialog/>
    <simple-dialog/>
    <setting-group-dialog/>
    <page-attr-dialog/>
    <set-value-manager-dialog/>
    <symbol-update-dialog/>
    <process-form-dialog/>
    <search-dialog/>
    <batch-edit-dialog/>
    <connect-device-dialog/>
    <signal-watch-dialog/>
    <create-project-dialog/>
    <preference-dialog/>
    <platform-release-dialog/>
    <record-dialog/>
  </div>
</template>

<script>
import SimpleDialog from './simpleDialog.vue'
import SetValueManagerDialog from './setValueManagerDialog.vue'
import SettingGroupDialog from './settingGroupDialog.vue'
import PageAttrDialog from './pageAttrDialog.vue'
import SymbolUpdateDialog from './vfbPackageUpdateDialog/symbolUpdateDialog.vue'
import ProcessFormDialog from './processFormDialog.vue'
import SearchDialog from './search/searchDialog.vue'
import BatchEditDialog from './batchEditDialog.vue'
import ConnectDeviceDialog from './debugMode/conncetDeviceDialog.vue'
import SignalWatchDialog from './debugMode/signalWatchDialog.vue'
import RecordDialog from './debugMode/recordDialog.vue'
import CreateProjectDialog from './createProjectDialog.vue'
import PreferenceDialog from './preferenceDialog.vue'
import PlatformReleaseDialog from './platformReleaseDialog.vue'
import ImportPlsymDialog from '@/renderer/pages/nextStudio/views/components/dialog/importPlsymDialog.vue'

export default {
  name: 'dialogContainer',
  components: {
    ImportPlsymDialog,
    PlatformReleaseDialog,
    PreferenceDialog,
    CreateProjectDialog,
    RecordDialog,
    ConnectDeviceDialog,
    SignalWatchDialog,
    BatchEditDialog,
    SearchDialog,
    ProcessFormDialog,
    SymbolUpdateDialog,
    PageAttrDialog,
    SettingGroupDialog,
    SetValueManagerDialog,
    SimpleDialog
  }
}
</script>

<style scoped>

</style>
