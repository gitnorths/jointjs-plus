<template>
  <div id="paramsTableViewContainer">
    <vxe-toolbar size="mini" custom>
      <template v-slot:buttons>
        <vxe-button content="添加" @click="insertMany" status="primary" icon="el-icon-plus" style="margin-left: 12px"
                    disabled/>
        <vxe-button content="批量修改" @click="batchEdit" status="success" icon="el-icon-edit" disabled/>
      </template>
    </vxe-toolbar>
    <div style="height: calc(100% - 46px)">
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
        :row-config="{isCurrent: true, isHover: true, keyField: 'rowId', useKey: true}"
        :edit-config="{trigger: 'dblclick', mode: 'cell', showIcon: false}"
        :checkbox-config="{trigger: 'cell', highlight: true, range: true}"
        :data="pageTableData"
        :menu-config="tableMenu"
        :edit-rules="validRules"
        :seq-config="{seqMethod}"
        @edit-actived="editActiveHandler"
        @edit-closed="editDone"
        @cell-click="cellClickHandler"
        @menu-click="contextMenuClickHandler"
        ref="vxTable">
        <vxe-column width="36" title="拖动排序" class-name="drag-btn">
          <template>
            <span>
              <i class="fa fa-sort"/>
            </span>
          </template>
          <template v-slot:header>
            <vxe-tooltip v-model="showHelpTip" content="按住后可以上下拖动排序！" enterable>
              <i class="vxe-icon--question" @click="showHelpTip = !showHelpTip"/>
            </vxe-tooltip>
          </template>
        </vxe-column>
        <vxe-column type="checkbox" width="44"/>
        <vxe-column title="#" type="seq" width="36"/>
        <vxe-column field="name" title="变量名" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="regName" title="注册变量名" width="120" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="desc" title="描述" width="120" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="type" title="变量类型" width="110" :edit-render="{}"
                    :class-name="columnClassName">
          <template v-slot="{row}">
            {{ varType[row.type] }}
          </template>
          <template v-slot:edit="{row}">
            <vxe-select v-model="row.type" ref="vxSelect" transfer>
              <vxe-option v-for="opt in variableList" :key="opt.value" :value="opt.value" :label="opt.label"/>
            </vxe-select>
          </template>
        </vxe-column>
        <vxe-column field="optTypeList" title="可选变量类型列表" width="150" :formatter="formatOptTypeList"
                    :edit-render="{}" :class-name="columnClassName">
          <template v-slot:edit="{row}">
            <vxe-select v-model="row.optTypeList" multiple :options="optTypeList" ref="vxSelect"
                        @change="(row)" transfer/>
          </template>
        </vxe-column>
        <vxe-column field="default" title="缺省值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="value" title="设置值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
      </vxe-table>
    </div>
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
import editMixins from './editMixins'
import { SymbolBlockConstants } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'
import { VariableTypeEnum } from '@/model/enum'

export default {
  name: 'InnersTable',
  mixins: [editMixins],
  data () {
    return {
      tagProp: SymbolBlockConstants.inners
    }
  },
  computed: {
    varType () {
      return VariableTypeEnum
    }
  },
  methods: {},
  mounted () {
    this.mountSortable()
  }
}
</script>

<style lang="scss">
#paramsTableViewContainer {
  height: calc(100% - 36px);
  width: 100%;

  .vxe-tools--operate {
    margin-right: 12px;
  }
}
</style>
