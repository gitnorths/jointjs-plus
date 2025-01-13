<template>
  <div class="tipGraphContainer">
    <div class="tipGraph" ref="container" :key="key">
    </div>
  </div>
</template>

<script>

export default {
  name: 'tipGraph',
  props: {
    symbol: {
      required: true
    }
  },
  watch: {
    symbol () {
      ++this.key
      this.$nextTick(() => {
        this.container = this.$refs.container
        this.initGraph()
      })
    }
  },
  data () {
    return {
      key: 1,
      container: null,
      graph: null
    }
  },
  methods: {
    initGraph () {
      // todo
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.container = this.$refs.container
      this.initGraph()
    })
  }
}
</script>

<style lang="scss" scoped>
.tipGraphContainer {
  display: block;
  max-height: calc(100vh - 60px);
  overflow-y: auto;

  .tipGraph {
    overflow: auto;
  }
}
</style>
