<template>
  <div ref="item" class="editableListItem" style="width: 250px" @dblclick="edit">
    <input ref="input" v-if="editable" :type="type" :value="value"
           @change="handleChange"
           @blur="check"
           @keypress="keyPressHandler"
           class="editable_list_input width--100 height--100 border--none"
    />
    <div v-else>
      <span>{{ value ? getShowText() : '(空)' }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'editableListItem',
  props: {
    text: [String, Number],
    type: {
      type: String,
      default: 'text'
    },
    rule: Function,
    valueChangedCallback: Function
  },
  watch: {
    editable () {
      if (this.editable) {
        this.$nextTick(() => {
          this.$refs.input.focus()
        })
      }
    }
  },
  data () {
    return {
      value: this.getValue(),
      editable: false
    }
  },
  methods: {
    check () {
      if (this.editable) {
        this.editable = false
      }
      let valueCallback = this.value

      if (R.equals('datetime-local', this.type)) {
        valueCallback = this.value.split('T').join(' ')
      }
      this.valueChangedCallback(valueCallback)
    },
    edit () {
      if (this.editable) {
        this.editable = false
      }
      this.editable = true
    },
    handleChange (e) {
      const tmpValue = e.target.value

      if (this.rule instanceof Function && !this.rule(tmpValue)) {
        return
      }
      this.value = tmpValue
    },
    keyPressHandler (e) {
      if (R.equals(e.keyCode, 13)) {
        this.editable = false
      }
    },
    getValue (text = this.text) {
      if (R.equals('datetime-local', this.type)) {
        if (R.equals(R.indexOf('T', text), -1)) {
          return text.split(' ').join('T')
        }
      }
      return text
    },
    getShowText (value = this.value) {
      if (R.equals('datetime-local', this.type)) {
        return value.split('T').join(' ')
      }
      return value
    }
  },
  mounted () {
    this.$nextTick(() => {
      const standardNode = this.$refs.item.parentElement

      if (R.isNotNil(standardNode)) {
        const tdHeight = standardNode.offsetHeight

        if (R.isNotNil(tdHeight)) {
          this.$refs.item.style.height = `${tdHeight - 1}px` // 需要比父节点稍小
        }
      }
    })
  }
}
</script>

<style scoped>
.editable_list_input {
  background: #FFF;
  color: #000;
}

.width--100 {
  width: 100%;
}

.height--100 {
  height: 100%;
}

.border--none {
  border: 0;
}
</style>
