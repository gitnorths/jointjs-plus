<template>
  <div>
    <symbol-archive-dialog v-if="archiveDialogVisible"/>
    <symbol-lib-dialog v-if="symbolLibDialogVisible"/>
    <symbol-block-dialog v-if="symbolBlockDialogVisible"/>
    <batch-edit-dialog v-if="batchEditVisible"/>
    <add-rows-dialog v-if="addRowsVisible"/>
  </div>
</template>

<script>
import SymbolArchiveDialog from './symbolArchiveDialog.vue'
import SymbolBlockDialog from './symbolBlockDialog.vue'
import SymbolLibDialog from './symbolLibDialog.vue'
import BatchEditDialog from './batchEditDialog.vue'
import AddRowsDialog from './addRowsDialog.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'dialogContainer',
  components: {
    SymbolArchiveDialog,
    SymbolLibDialog,
    SymbolBlockDialog,
    AddRowsDialog,
    BatchEditDialog
  },
  computed: {
    ...mapGetters({
      archiveDialogVisible: 'archiveDialogVisible',
      symbolLibDialogVisible: 'symbolLibDialogVisible',
      symbolBlockDialogVisible: 'symbolBlockDialogVisible',
      batchEditVisible: 'batchEditVisible',
      addRowsVisible: 'addRowsVisible'
    })
  }
}
</script>

<style scoped>

</style>
