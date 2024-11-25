import { mxConstants, mxEvent, mxEventSource, mxPopupMenu, mxUndoManager } from '@/renderer/common/mxgraph'
import { MyMxGraph } from './MyMxGraph'
import {
  ActionRecord,
  HistoryStack
} from '@/renderer/pages/nextStudio/views/components/workArea/graphEditorView/OperationHistory'

/**
 * Measurements Units
 */
mxConstants.POINTS = 1
mxConstants.MILLIMETERS = 2
mxConstants.INCHES = 3
mxConstants.METERS = 4
/**
 * This ratio is with page scale 1
 */
mxConstants.PIXELS_PER_MM = 3.937
mxConstants.PIXELS_PER_INCH = 100

/**
 * Consumes click events for disabled menu items.
 */
const mxPopupMenuAddItem = mxPopupMenu.prototype.addItem
mxPopupMenu.prototype.addItem = function (title, image, funct, parent, iconCls, enabled) {
  const result = mxPopupMenuAddItem.call(this, title, image, funct, parent, iconCls, enabled)

  if (enabled != null && !enabled) {
    mxEvent.addListener(result, 'mousedown', function (evt) {
      mxEvent.consume(evt)
    })
  }

  return result
}

export class MyEditor extends mxEventSource {
  constructor (container, debugMode) {
    super()
    this.setEventSource(this)
    this.graph = new MyMxGraph(container, debugMode)
    this.createUndoManager()
    /**
     * Specifies if the canvas should be extended in all directions. Default is true.
     */
    this.extendCanvas = true
  }

  createUndoManager () {
    // 历史记录
    const undoManager = new mxUndoManager()
    const historyStack = new HistoryStack(undoManager)
    this.historyStack = historyStack // FIXME
    const undoListener = function (sender, evt) {
      undoManager.undoableEditHappened(evt.getPropery('edit'))
      historyStack.addToHistory(new ActionRecord(true))
    }
    this.graph.getModel().addListener(mxEvent.UNDO, undoListener)
    this.graph.getView().addListener(mxEvent.UNDO, undoListener)

    // Keeps the selection in sync with the history
    const undoHandler = function (sender, evt) {
      const changes = evt.getProperty('edit').changes
      const cand = this.graph.getSelectionCellsForChanges(changes)
      let scrolled = false

      if (cand.length > 0) {
        const cells = []

        for (let i = 0; i < cand.length; i++) {
          if (this.graph.view.getState(cand[i]) != null) {
            cells.push(cand[i])

            if (!scrolled) {
              this.graph.scrollCellToVisible(cand[i])
              scrolled = true
            }
          }
        }

        this.graph.setSelectionCells(cells)
      }
    }

    undoManager.addListener(mxEvent.UNDO, undoHandler)
    undoManager.addListener(mxEvent.REDO, undoHandler)
  }

  static isDarkMode () {
    return MyEditor.darkMode
  }

  /**
   * Default length for global unique IDs.
   */
  static guid (length) {
    const len = (length != null) ? length : MyEditor.GUID_LENGTH
    const rtn = []

    for (let i = 0; i < len; i++) {
      rtn.push(MyEditor.GUID_ALPHABET.charAt(Math.floor(Math.random() * MyEditor.GUID_ALPHABET.length)))
    }

    return rtn.join('')
  }

  static createSvgDataUri (xml) {
    return undefined
  }
}

/**
 * Dynamic change of dark mode for minimal and sketch theme.
 */
MyEditor.darkMode = false
/**
 * Specifies the image URL to be used for the transparent background.
 */
MyEditor.hintOffset = 20
/**
 * Alphabet for global unique IDs.
 */
MyEditor.GUID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'

/**
 * Default length for global unique IDs.
 */
MyEditor.GUID_LENGTH = 20
MyEditor.editImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMThweCIgZmlsbD0iIzAwMDAwMCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTE0LjA2IDkuMDJsLjkyLjkyTDUuOTIgMTlINXYtLjkybDkuMDYtOS4wNk0xNy42NiAzYy0uMjUgMC0uNTEuMS0uNy4yOWwtMS44MyAxLjgzIDMuNzUgMy43NSAxLjgzLTEuODNjLjM5LS4zOS4zOS0xLjAyIDAtMS40MWwtMi4zNC0yLjM0Yy0uMi0uMi0uNDUtLjI5LS43MS0uMjl6bS0zLjYgMy4xOUwzIDE3LjI1VjIxaDMuNzVMMTcuODEgOS45NGwtMy43NS0zLjc1eiIvPjwvc3ZnPg=='
MyEditor.trashImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMThweCIgZmlsbD0iIzAwMDAwMCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTE2IDl2MTBIOFY5aDhtLTEuNS02aC01bC0xIDFINXYyaDE0VjRoLTMuNWwtMS0xek0xOCA3SDZ2MTJjMCAxLjEuOSAyIDIgMmg4YzEuMSAwIDItLjkgMi0yVjd6Ii8+PC9zdmc+'
