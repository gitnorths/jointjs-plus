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
    <vxe-column field="na" title="短地址" width="190" sortable></vxe-column>
    <vxe-column field="desc" title="描述" width="100" sortable></vxe-column>
    <vxe-column field="location" title="所属分组" width="100" sortable></vxe-column>
    <vxe-column title="操作" width="60" fixed="right">
      <template v-slot="{ row }">
        <el-button @click="locateGroup(row)" type="text" size="small">定位</el-button>
      </template>
    </vxe-column>
  </vxe-table>
</template>

<script>
export default {
  name: 'searchSignalGroupTable',
  props: {
    tableData: {
      required: true
    },
    groupList: {
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
    locateGroup (currentRow) {
      this.$vbus.$emit('FOCUS_LINE', currentRow.id)
      if (this.activeKey !== `${currentRow.clazzName}-${currentRow.groupId}`) {
        this.$store.commit('setFocusedSignalId', currentRow.id)
        const group = R.find(R.propEq(currentRow.groupId, 'id'))(this.groupList)
        this.$store.commit('addNodeToContainer', group)
      }
    }
  }
}
</script>

<style scoped>

</style>
