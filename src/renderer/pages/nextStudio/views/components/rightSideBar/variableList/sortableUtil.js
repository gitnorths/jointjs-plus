import Sortable from 'sortablejs'

export const createSortable = (el, data, name, self) => {
  return Sortable.create(el,
    {
      group: { name, pull: 'clone', put: false },
      forceFallback: true,
      sort: false,
      handle: `.${name}`,
      onStart: (ev) => {
        const { oldIndex } = ev
        const dragData = data.children[oldIndex]
        self.$store.commit('setDragData', dragData)
      }
    })
}
