<template>
  <vxe-table
    :data="tableData"
    height="auto"
    auto-resize
    border
    stripe
    size="mini"
    align="center"
    show-overflow
    :column-config="{resizable: true}"
    :row-config="{isCurrent: true, isHover: true}"
    :scroll-y="{enabled: true, gt: 15}">
    <vxe-column type="seq" width="44"></vxe-column>
    <vxe-column field="name" title="功能块名" width="100" sortable></vxe-column>
    <vxe-column field="instName" title="实例名" width="90" sortable></vxe-column>
    <vxe-column field="desc" title="描述" width="100" sortable></vxe-column>
    <vxe-column field="na" title="短地址" width="100" sortable></vxe-column>
    <vxe-column field="location" title="所属页面" width="100" sortable></vxe-column>
    <vxe-column title="操作" width="60" fixed="right">
      <template v-slot="{ row }">
        <el-button @click="locateVfb(row)" type="text" size="small">定位</el-button>
      </template>
    </vxe-column>
  </vxe-table>
</template>

<script>
export default {
  name: 'searchVfbTable',
  props: {
    tableData: {
      required: true
    },
    pageList: {
      required: true
    }
  },
  data () {
    return {}
  },
  computed: {
    activeKey () {
      return this.$store.getters.activeKey
    }
  },
  methods: {
    locateVfb (currentRow) {
      this.$vbus.$emit('FOCUS', currentRow.id)
      if (this.activeKey !== `PageGraph-${currentRow.pageGraphId}`) {
        this.$store.commit('setFocusedVfbId', currentRow.id)
        const pageGraph = R.find(R.propEq(currentRow.pageGraphId, 'id'))(this.pageList)
        this.$store.commit('addNodeToContainer', pageGraph)
      }
    }
  }
}
</script>

<style scoped>

</style>
