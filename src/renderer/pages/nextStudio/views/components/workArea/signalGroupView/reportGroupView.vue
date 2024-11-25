<template>
  <div id="reportGroupViewContainer">
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
      <vxe-column field="index" title="#" width="42" :class-name="columnClassName"></vxe-column>
      <vxe-column field="name" title="变量名" width="190" align="left" header-align="center"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="abbr" title="词条" width="140" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="desc" title="描述" width="140" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="classify" title="分类" width="64" :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ classifyStr(row.classify) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.classify" transfer ref="vxSelect" clearable>
            <vxe-option v-for="opt in classifyOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
          </vxe-select>
        </template>
      </vxe-column>
      <vxe-column field="q" title="时标" width="100" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="t" title="品质" width="100" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="param" title="参数" width="100" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="tripType" title="动作类型" width="100" :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ tripType(row.tripType) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.tripType" transfer ref="vxSelect" clearable>
            <vxe-option v-for="opt in tripTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
          </vxe-select>
        </template>
      </vxe-column>
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
import { ReportGroupItem } from '@/model/dto'
import { TripTypeEnum } from '@/model/enum'

export default {
  name: 'reportGroupView',
  mixins: [tableMixin],
  props: {},
  computed: {},
  watch: {},
  data () {
    return {
      columnProps: [
        'name', 'abbr', 'desc', 'classify', 't', 'q', 'param', 'tripType'
      ],
      tripTypeOptions: [
        { label: '启动', value: TripTypeEnum.BOOT },
        { label: '跳闸', value: TripTypeEnum.TRIP }
      ]
    }
  },
  methods: {
    tripType (tripType) {
      switch (tripType) {
        case TripTypeEnum.TRIP:
          return '跳闸'
        case TripTypeEnum.BOOT:
          return '启动'
      }
    },
    mountSortable () {
      this.$nextTick(() => {
        if (this.sortable) {
          this.sortable.destroy()
        }
        this.sortable = Sortable.create(this.$refs.vxTable.$el.querySelector('.body--wrapper>.vxe-table--body tbody'),
          {
            group: {
              name: 'ReportGroup',
              put: ['VarTreeOutput']
            },
            handle: '.drag-btn',
            onUpdate: this.dragSortDone(),
            onAdd: this.insertDone()
          })
      })
    },
    buildInsertRecord (inputData) {
      const data = new ReportGroupItem(inputData)
      data.name = inputData.sAddr
      return { ...data }
    }
  },
  mounted () {
    this.$vbus.$on('VAR_TREE_OUTPUT_DBL_CLICKED', this.insertLast)
  },
  destroyed () {
    this.$vbus.$off('VAR_TREE_OUTPUT_DBL_CLICKED', this.insertLast)
  }
}

</script>

<style scoped>
#reportGroupViewContainer {
  height: calc(100% - 36px);
  width: 100%;
}
</style>
