<template>
  <div id="waveGroupViewContainer">
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

      <vxe-column v-if="isAnalogGroup || isStateGroup" field="attr" title="分组类型" width="116"
                  :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ attr(row.attr) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.attr" transfer ref="vxSelect">
            <vxe-option v-for="opt in attrOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
          </vxe-select>
        </template>
      </vxe-column>

      <vxe-column v-if="isAnalogGroup || isStateGroup" field="level" title="通道等级" width="116"
                  :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ level(row.level) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.level" transfer ref="vxSelect" clearable>
            <vxe-option v-for="opt in levelOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
          </vxe-select>
        </template>
      </vxe-column>
      <vxe-column v-if="isAnalogGroup" field="amp" title="幅值" width="190" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>

      <vxe-column v-if="isTrigGroup" field="priority" title="触发优先级" width="116"
                  :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ priority(row.priority) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.priority" transfer ref="vxSelect" clearable>
            <vxe-option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
          </vxe-select>
        </template>
      </vxe-column>
      <vxe-column v-if="isTrigGroup" field="mode" title="触发方式" width="116"
                  :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ mode(row.mode) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.mode" transfer ref="vxSelect" clearable>
            <vxe-option v-for="opt in modeOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
          </vxe-select>
        </template>
      </vxe-column>
      <vxe-column v-if="isTrigGroup" field="frontNum" title="故障前录波点数" width="190"
                  :edit-render="{name: 'VxeInput', props: {type: 'integer', min: 0 ,max: 120}}"
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
import { WaveGroupItem } from '@/model/dto'
import { WaveAttrEnum, WaveLevelEnum, WavePriorityEnum, WaveTriggerTypeEnum } from '@/model/enum'

export default {
  name: 'waveGroupView',
  mixins: [tableMixin],
  props: {},
  computed: {
    groupName () {
      return this.groupDto.name
    },
    isStateGroup () {
      return /^STATE_TABLE$/.test(this.groupName)
    },
    isAnalogGroup () {
      return /^ANALOG_TABLE$/.test(this.groupName)
    },
    isTrigGroup () {
      return /^TRIG_TABLE$/.test(this.groupName)
    },
    isReportGroup () {
      return /^REPORT_TABLE$/.test(this.groupName)
    },
    columnProps () {
      if (this.isAnalogGroup) {
        return ['name', 'abbr', 'desc', 'attr', 'level', 'amp']
      } else if (this.isReportGroup) {
        return ['name', 'abbr', 'desc']
      } else if (this.isStateGroup) {
        return ['name', 'abbr', 'desc', 'attr', 'level']
      } else if (this.isTrigGroup) {
        return ['name', 'abbr', 'desc', 'mode', 'frontNum']
      }
      return []
    }
  },
  watch: {},
  data () {
    return {
      attrOptions: [
        { label: '差动', value: WaveAttrEnum.DIFF },
        { label: '高压', value: WaveAttrEnum.HV },
        { label: '中压', value: WaveAttrEnum.MV },
        { label: '低压1', value: WaveAttrEnum.LV1 },
        { label: '低压2', value: WaveAttrEnum.LV2 },
        { label: '全部', value: WaveAttrEnum.ALL }
      ],
      levelOptions: [
        { label: '用户级', value: WaveLevelEnum.USER },
        { label: '调试级', value: WaveLevelEnum.DEBUG }
      ],
      priorityOptions: [
        { label: '高', value: WavePriorityEnum.HIGH },
        { label: '低', value: WavePriorityEnum.LOW }
      ],
      modeOptions: [
        { label: '上升沿', value: WaveTriggerTypeEnum.RE },
        { label: '下降沿', value: WaveTriggerTypeEnum.FE },
        { label: '双边沿', value: WaveTriggerTypeEnum.BE },
        { label: '高电平', value: WaveTriggerTypeEnum.HL },
        { label: '低电平', value: WaveTriggerTypeEnum.LL }
      ]
    }
  },
  methods: {
    attr (attr) {
      switch (attr) {
        case WaveAttrEnum.DIFF:
          return '差动'
        case WaveAttrEnum.HV:
          return '高压'
        case WaveAttrEnum.MV:
          return '中压'
        case WaveAttrEnum.LV1:
          return '低压1'
        case WaveAttrEnum.LV2:
          return '低压2'
        case WaveAttrEnum.ALL:
          return '全部'
      }
    },
    level (level) {
      switch (level) {
        case WaveLevelEnum.USER:
          return '用户级'
        case WaveLevelEnum.DEBUG:
          return '调试级'
      }
    },
    priority (priority) {
      switch (priority) {
        case WavePriorityEnum.HIGH:
          return '高'
        case WavePriorityEnum.LOW:
          return '低'
      }
    },
    mode (mode) {
      switch (mode) {
        case WaveTriggerTypeEnum.RE:
          return '上升沿'
        case WaveTriggerTypeEnum.FE:
          return '下降沿'
        case WaveTriggerTypeEnum.BE:
          return '双边沿'
        case WaveTriggerTypeEnum.HL:
          return '高电平'
        case WaveTriggerTypeEnum.LL:
          return '低电平'
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
              name: 'WaveGroup',
              put: ['VarTreeOutput']
            },
            handle: '.drag-btn',
            onUpdate: this.dragSortDone(),
            onAdd: this.insertDone()
          })
      })
    },
    buildInsertRecord (inputData) {
      const data = new WaveGroupItem(inputData)
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
#waveGroupViewContainer {
  height: calc(100% - 36px);
  width: 100%;
}
</style>
