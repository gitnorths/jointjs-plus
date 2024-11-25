<template>
  <div id="outputsTableViewContainer">
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
        :edit-config="{trigger: 'dblclick', mode: 'cell', showIcon: false, beforeEditMethod: activeMethod}"
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
              <i class="fa fa-sort"></i>
            </span>
          </template>
          <template v-slot:header>
            <vxe-tooltip v-model="showHelpTip" content="按住后可以上下拖动排序！" enterable>
              <i class="vxe-icon--question" @click="showHelpTip = !showHelpTip"></i>
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
        <vxe-column field="structType" title="结构体类型" :edit-render="{name: 'VxeInput'}" width="90"
                    :class-name="columnClassName"/>
        <vxe-column field="optTypeList" title="可选变量类型列表" width="150" :formatter="formatOptTypeList"
                    :edit-render="{}" :class-name="columnClassName">
          <template v-slot:edit="{row}">
            <vxe-select v-model="row.optTypeList" multiple :options="optTypeList" ref="vxSelect"
                        @change="(row)" transfer/>
          </template>
        </vxe-column>
        <vxe-column field="level" title="任务等级" width="100" :edit-render="{}"
                    :class-name="columnClassName">
          <template v-slot="{row}">
            {{ TaskLevelEnum[row.level] }}
          </template>
          <template v-slot:edit="{row}">
            <vxe-select v-model="row.level" ref="vxSelect" transfer>
              <vxe-option v-for="opt in levelOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
            </vxe-select>
          </template>
        </vxe-column>
        <vxe-column field="default" title="缺省值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="value" title="设置值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="format" title="格式" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="coeff" title="系数" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="unit" title="单位" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="abbr" title="缩略语" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="showAttr" title="显示属性" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="pNorm" title="一次额定值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="pMin" title="一次最小值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="pMax" title="一次最大值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="sNorm" title="二次额定值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="sMin" title="二次最小值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="sMax" title="二次最大值" width="80" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"/>
        <vxe-column field="isShowGraph" title="端口显示模式" width="120" :edit-render="{}"
                    :class-name="columnClassName">
          <template v-slot="{row}">
            {{ formatDisplayMode(row) }}
          </template>
          <template v-slot:edit="{row}">
            <vxe-select v-model="row.isShowGraph" ref="vxSelect" transfer>
              <vxe-option :value=0 label="不显示"/>
              <vxe-option :value=1 label="显示"/>
            </vxe-select>
          </template>
        </vxe-column>
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
import { TaskLevelEnum, VariableTypeEnum } from '@/model/enum'

export default {
  name: 'OutputsTable',
  mixins: [editMixins],
  data () {
    return {
      tagProp: SymbolBlockConstants.outputs
    }
  },
  computed: {
    TaskLevelEnum () {
      return TaskLevelEnum
    }
  },
  methods: {
    activeMethod ({
      row,
      column
    }) {
      if (column.property === 'optTypeList') {
        return row.type === VariableTypeEnum.Any
      } else if (column.property === 'structType') {
        return row.type === VariableTypeEnum.Struct
      }
      return true
    }
  },
  mounted () {
    this.mountSortable()
  }
}
</script>

<style lang="scss">
#outputsTableViewContainer {
  height: calc(100% - 36px);
  width: 100%;

  .vxe-tools--operate {
    margin-right: 12px;
  }
}

</style>
