<template>
  <div class="messageBoxContainer" ref="container">
    <ul>
      <li v-for="(message, index) in messages" :key="index" :class="message.level">
        <span class="time">{{ message['time'] }}</span> -
        <span class="level">{{ message['level'] }}</span> -
        <span class="message">{{ message['message'] }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'messageBox',
  data () {
    return {
      messages: []
    }
  },
  watch: {
    messages () {
      this.$nextTick(() => {
        const container = this.$refs.container
        container.scrollTop = container.scrollHeight
      })
    }
  },
  methods: {
    addMessage (message) {
      this.messages.push(message)
    }
  },
  mounted () {
    this.$vbus.$on('ADD_MESSAGE_TO_CONTAINER', this.addMessage)
  },
  destroyed () {
    this.$vbus.$off('ADD_MESSAGE_TO_CONTAINER', this.addMessage)
  }
}
</script>

<style lang="scss">
.messageBoxContainer {
  overflow: auto;
  padding: 10px;
  width: 100%;
  height: 100%;

  ul {
    padding-left: 15px;
    list-style-type: circle;
    white-space: pre-line;

    $primary: #409eff;
    $success: #67c23a;
    $info: #909399;
    $warning: #e6a23c;
    $danger: #f56c6c;

    .info {
      color: $info;
    }

    .error {
      color: $danger;
    }

    .warn {
      color: $warning;
    }
  }
}
</style>
