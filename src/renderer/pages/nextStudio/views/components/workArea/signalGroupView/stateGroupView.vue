<template>
  <div id="stateGroupViewContainer">
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
          <vxe-select v-model="row.classify" transfer ref="vxSelect">
            <vxe-option v-for="opt in classifyOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
          </vxe-select>
        </template>
      </vxe-column>

      <vxe-column field="q" title="时标" width="100" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="t" title="品质" width="100" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="norm" title="额定值" width="100" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="db_cat" title="变化死区类型" width="116" :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ dbCat(row.db_cat) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.db_cat" transfer ref="vxSelect" clearable>
            <vxe-option v-for="opt in dbCatOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
          </vxe-select>
        </template>
      </vxe-column>

      <vxe-column field="evt" title="事件" width="64" :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ row.evt ? '是' : '否' }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.evt" transfer ref="vxSelect" clearable>
            <vxe-option v-for="opt in boolOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
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
import { StateGroupItem } from '@/model/dto'
import { DbCatEnum } from '@/model/enum'

export default {
  name: 'stateGroupView',
  mixins: [tableMixin],
  props: {},
  computed: {},
  watch: {},
  data () {
    return {
      columnProps: [
        'name', 'abbr', 'desc', 't', 'q', 'classify', 'evt', 'norm', 'db_cat'
      ],
      dbCatOptions: [
        { label: '应用处理', value: DbCatEnum.app_db },
        { label: '电流电压', value: DbCatEnum.mx_db },
        { label: '功率', value: DbCatEnum.pq_db },
        { label: '功率因数', value: DbCatEnum.cos_db },
        { label: '频率', value: DbCatEnum.f_db },
        { label: 'goose直流量变化', value: DbCatEnum.gse_db },
        { label: '扩展类型1', value: DbCatEnum.ex1_db },
        { label: '扩展类型2', value: DbCatEnum.ex2_db }
      ]
    }
  },
  methods: {
    dbCat (dbCat) {
      switch (dbCat) {
        case DbCatEnum.app_db:
          return '应用处理'
        case DbCatEnum.mx_db:
          return '电流电压'
        case DbCatEnum.pq_db:
          return '功率'
        case DbCatEnum.cos_db:
          return '功率因数'
        case DbCatEnum.f_db:
          return '频率'
        case DbCatEnum.gse_db:
          return 'goose直流量变化'
        case DbCatEnum.ex1_db:
          return '扩展类型1'
        case DbCatEnum.ex2_db:
          return '扩展类型2'
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
              name: 'StateGroup',
              put: ['VarTreeOutput']
            },
            handle: '.drag-btn',
            onUpdate: this.dragSortDone(),
            onAdd: this.insertDone()
          })
      })
    },
    buildInsertRecord (inputData) {
      const data = new StateGroupItem(inputData)
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
#stateGroupViewContainer {
  height: calc(100% - 36px);
  width: 100%;
}
</style>
