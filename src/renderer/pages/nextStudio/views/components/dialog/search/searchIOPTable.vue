<template>
  <vxe-table
    :data="tableData"
    stripe
    border
    height="auto"
    auto-resize
    size="mini"
    align="center"
    show-overflow
    :column-config="{resizable: true}"
    :row-config="{isCurrent: true, isHover: true}"
    :scroll-y="{enabled: true, gt: 15}">
    <vxe-column type="seq" width="44"></vxe-column>
    <vxe-column field="na" title="短地址" width="190" sortable></vxe-column>
    <vxe-column field="name" title="变量名" width="100" sortable></vxe-column>
    <vxe-column field="desc" title="描述" width="100" sortable></vxe-column>
    <vxe-column field="location" title="所属功能块" width="100" sortable></vxe-column>
    <vxe-column title="操作" width="60" fixed="right">
      <template v-slot="{row}">
        <el-button @click="locateIOP(row)" type="text" size="small">定位</el-button>
      </template>
    </vxe-column>
  </vxe-table>
</template>

<script>
export default {
  name: 'searchIOPTable',
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
    locateIOP (currentRow) {
      this.$vbus.$emit('FOCUS', currentRow.vfbId)
      if (this.activeKey !== `PageGraph-${currentRow.pageGraphId}`) {
        this.$store.commit('setFocusedVfbId', currentRow.vfbId)
        const pageGraph = R.find(R.propEq(currentRow.pageGraphId, 'id'))(this.pageList)
        this.$store.commit('addNodeToContainer', pageGraph)
      }
    }
  }
}
</script>

<style scoped>

</style>
