export const tableMixin = {
  data () {
    return {
      tableMenu: {
        body: {
          options: [
            [{ code: 'batch-edit', name: '批量编辑', prefixIcon: 'el-icon-edit', visible: true, disabled: false }],
            [{
              code: 'batch-add',
              name: '批量加入监控',
              prefixIcon: 'fa fa-binoculars',
              visible: true,
              disabled: false
            }]
          ]
        },
        visibleMethod: this.visibleMethod
      }
    }
  },
  computed: {
    debugMode () {
      return this.$store.getters.debugMode
    }
  },
  methods: {
    visibleMethod ({ options, row }) {
      if (row) {
        this.$refs.vxTable.setCurrentRow(row)
      }
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      options.forEach(list => {
        list.forEach(item => {
          if (['batch-edit'].includes(item.code)) {
            item.visible = !this.debugMode
            item.disabled = selectRecords.length < 2
          } else if (['batch-add'].includes(item.code)) {
            item.visible = this.debugMode
          }
        })
      })
      return true
    },
    contextMenuClickHandler ({ menu }) {
      switch (menu.code) {
        case 'batch-edit':
          this.batchEdit()
          break
        case 'batch-add':
          this.batchAddToWatch()
      }
    },
    batchEdit () {
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      if (selectRecords && selectRecords.length > 0) {
        this.$vbus.$emit('OPEN_BATCH_EDIT_DIALOG', this.tagKey)
      } else {
        this.$notification.openWarningNotification('请先选择要批量编辑的数据')
      }
    },
    convertVal (orgValue, replaceOption) {
      const { searchValue, replaceValue, matchCase, matchWords } = replaceOption
      if (orgValue) {
        if (searchValue) {
          const regExp = matchWords
            ? new RegExp(`^${searchValue}$`, matchCase ? 'g' : 'ig')
            : new RegExp(searchValue, matchCase ? 'g' : 'ig')
          return orgValue.replace(regExp, replaceValue)
        } else {
          return orgValue
        }
      } else if (!searchValue && replaceValue) {
        return replaceValue
      } else {
        return orgValue
      }
    },
    editDone () {
      // TODO
    },
    batchEditDone ({ data, props }) {
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()

      selectRecords.forEach(row => {
        props.forEach(key => {
          const changeVal = data[key]
          // desc等属性传递的对象来修改值
          row[key] = this.convertVal(row[key], changeVal)
        })
      })
      this.editDone()
    },
    batchAddToWatch () {
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()

      selectRecords.forEach(row => {
        this.$store.commit('addToWatchedSignals', { na: row.na, annotation: row.desc || '' })
      })
    },
    addToWatch (signal) {
      this.$store.commit('addToWatchedSignals', { na: signal.na, annotation: signal.desc || '' })
    }
  },
  mounted () {
    this.$vbus.$on('BATCH_EDIT_TABLE_DATA', this.batchEditDone)
  },
  destroyed () {
    this.$vbus.$off('BATCH_EDIT_TABLE_DATA', this.batchEditDone)
  }
}
