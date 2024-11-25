<template>
  <div id="paramsTableViewContainer">
    <vxe-toolbar size="mini" custom>
      <template v-slot:buttons>
        <vxe-button content="添加" @click="insertMany" status="primary" icon="el-icon-plus" style="margin-left: 12px" disabled/>
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
import * as R from 'ramda'
import { SymbolBlockConstants } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'
import { TaskLevelEnum, VariableTypeEnum } from '@/model/enum'

export default {
  name: 'ParamsTable',
  mixins: [editMixins],
  data () {
    return {
      tagProp: SymbolBlockConstants.params,
      validRules: {
        name: [{ validator: this.nameValid }],
        min: [{ validator: this.minValid }],
        max: [{ validator: this.maxValid }],
        value: [{ validator: this.setValueValid }]
      }
    }
  },
  computed: {
    TaskLevelEnum () {
      return TaskLevelEnum
    },
    varType () {
      return VariableTypeEnum
    }
  },
  methods: {
    minValid ({ cellValue, row }) {
      if (/^\d+$/.test(cellValue) && /^\d+$/.test(row.max) && Number(cellValue) > Number(row.max)) {
        return new Error(`参数${row.name}的最小值不应该大于最大值`)
      }
      if (row.valueList && /^\d+$/.test(cellValue)) {
        const maxValueListVal = row.valueList.trim().split(' ').length - 1
        if (Number(cellValue) < 0) {
          return new Error(`参数${row.name}的最小值不应该小于0`)
        } else if (Number(cellValue) > maxValueListVal) {
          return new Error(`参数${row.name}的最小值不应该超过值列表长度`)
        }
      }
    },
    maxValid ({ cellValue, row }) {
      if (/^\d+$/.test(cellValue) && /^\d+$/.test(row.min) && Number(cellValue) < Number(row.min)) {
        return new Error(`参数${row.name}的最大值不应该小于最小值`)
      }
      if (row.valueList && /^\d+$/.test(cellValue)) {
        const maxValueListVal = row.valueList.trim().split(' ').length - 1
        if (Number(cellValue) < 0) {
          return new Error(`参数${row.name}的最大值不应该小于0`)
        } else if (Number(cellValue) > maxValueListVal) {
          return new Error(`参数${row.name}的最大值不应该超过值列表长度`)
        }
      }
    },
    setValueValid ({ cellValue, row }) {
      if (/^\d+$/.test(row.min) && /^\d+$/.test(row.max) && (Number(cellValue) < Number(row.min) || Number(cellValue) > Number(row.max))) {
        return new Error(`参数${row.name}的默认值超出取值范围`)
      }
      if (row.optional && !cellValue) {
        return new Error(`参数${row.name}为可选参数，必须设置默认值`)
      }
    },
    editDone ({ row, column }) {
      this.$refs.vxTable.fullValidate(true)
        .then((errMap) => {
          if (errMap) {
            return
          }
          // 修改值列表，自动去重
          if (column.property === 'valueList') {
            const arr = row.valueList.trim().split(' ')
            const uniq = R.uniq(arr)
            if (uniq && arr && uniq.length < arr.length) {
              this.$message.warning('重复项已自动去重')
            }
            row.valueList = uniq.join(' ')
          }
          this.judgeRowChanged(row)
          this.calcInsertRemoveRecord()
          this.recordDelta(row, 'editDone')
        })
        .catch(e => {
          this.$notification.openErrorNotification('校验失败' + e).logger()
          return e
        })
    },
    handleOptions (row) {
      const valueArray = row.valueList ? row.valueList.trim().split(' ') : []
      return valueArray.map((value, index) => ({
        label: value.trim(),
        value: index.toString()
      }))
    }
  },
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
