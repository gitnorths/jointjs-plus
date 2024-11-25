<template>
  <div id="controlGroupViewContainer">
    <vxe-table
      stripe
      border
      height="auto"
      auto-resize
      size="mini"
      align="center"
      show-overflow
      :loading="loading"
      :column-config="{resizable: true}"
      :row-config="{isCurrent: true, isHover: true, keyField: 'id', useKey: true}"
      :edit-config="{trigger: 'dblclick', mode: 'cell', showIcon: true}"
      :checkbox-config="{trigger: 'cell', range: true}"
      :data="pageTableData"
      :menu-config="tableMenu"
      :edit-rules="validRules"
      :row-class-name="rowClassName"
      @edit-actived="editActiveHandler"
      @edit-closed="editDone"
      @cell-click="cellClickHandler"
      @menu-click="contextMenuClickHandler"
      ref="vxTable">
      <vxe-column width="36" class-name="drag-btn">
        <template>
          <span>
            <i class="fa fa-sort"></i>
          </span>
        </template>
        <template v-slot:header>
          <vxe-tooltip v-model="showHelpTip" content="按住后可以上下拖动排序！" enterable>
            <i class="vxe-icon--question" @click="showHelpTip = !showHelpTip"></i>
          </vxe-tooltip>
        </template>
      </vxe-column>
      <vxe-column type="checkbox" width="44" align="left"></vxe-column>
      <vxe-column field="index" title="#" width="42"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="name" title="变量名" width="200" align="left" header-align="center"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="desc" title="描述" width="160" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="abbr" title="词条" width="160" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
    </vxe-table>
    <vxe-pager
      perfect
      size="mini"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="totalResult"
      :loading="loading"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="pageChangeHandler">
    </vxe-pager>
  </div>
</template>

<script>
import Sortable from 'sortablejs'
import { tableMixin } from '../tableMixin'
import { ControlGroupItem } from '@/model/dto'

export default {
  name: 'controlGroupView',
  mixins: [tableMixin],
  data () {
    return {
      columnProps: [
        'name', 'abbr', 'desc'
      ]
    }
  },
  methods: {
    mountSortable () {
      this.$nextTick(() => {
        if (this.sortable) {
          this.sortable.destroy()
        }
        this.sortable = Sortable.create(this.$refs.vxTable.$el.querySelector('.body--wrapper>.vxe-table--body tbody'),
          {
            group: { name: 'ControlGroup', put: ['VarTreeSymbol'] },
            handle: '.drag-btn',
            onUpdate: this.dragSortDone(),
            onAdd: this.insertDone()
          })
      })
    },
    buildInsertRecord (inputData) {
      const data = new ControlGroupItem(inputData)
      data.name = inputData.sAddr
      return { ...data }
    }
  },
  mounted () {
    this.$vbus.$on('VAR_TREE_SYMBOL_DBL_CLICKED', this.insertLast)
  },
  destroyed () {
    this.$vbus.$off('VAR_TREE_SYMBOL_DBL_CLICKED', this.insertLast)
  }
}

</script>

<style scoped>
#controlGroupViewContainer {
  height: calc(100% - 36px);
  width: 100%;
}
</style>
