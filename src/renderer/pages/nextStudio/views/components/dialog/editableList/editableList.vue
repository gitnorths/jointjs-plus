<template>
  <div class="editableListContainer">
    <table class="editableList">
      <tr v-for="(item, index) in listItems" :key="index">
        <template v-if="!R.includes(item.name, unExpectAttrName)">
          <td v-if="multiColumn" style="width:200px">
            {{ $i18n.t(`na.${item.name}`) }}
          </td>
          <td>
            <editable-list-item :rule="rules[item.name]" :text="item.value"
                                :valueChangedCallback="valueChangedHandler(item.name)"
                                :type="inputType(item.name)"></editable-list-item>
          </td>
        </template>
      </tr>
    </table>
  </div>
</template>

<script>
import EditableListItem from './editableListItem.vue'

export default {
  name: 'editableList',
  components: { EditableListItem },
  props: {
    listItems: Array,
    valueChangedCallback: Function,
    rules: {
      type: Object,
      default: () => ({})
    },
    multiColumn: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      unExpectAttrName: ['clazzName', 'id']
    }
  },
  methods: {
    valueChangedHandler (key) {
      return (value) => {
        this.valueChangedCallback(key, value)
      }
    },
    inputType (name) {
      if (R.equals(name, 'task1') || R.equals(name, 'task2') || R.equals(name, 'task3') || R.equals(name, 'task4')) {
        return 'number'
      }
      if (R.equals(name, 'modifiedTime')) {
        return 'datetime-local'
      }
      return 'text'
    }
  }
}
</script>

<style scoped>
.editableListContainer {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  user-select: none;
  background-color: #fff;
}

.editableList {
  white-space: nowrap;
  table-layout: fixed;
  margin: 2px 2px;
}

.editableList tr:nth-child(even) {
  background: #ececec;
}

.editableList tr:nth-child(odd) {
  background: #ffffff;
}

.editableList td {
  border: 1px solid #E8E8E8;
}

.editableList td:hover {
  background: #E6F7FF;
}
</style>
