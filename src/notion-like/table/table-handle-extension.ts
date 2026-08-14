import { Extension } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import { CellSelection } from '@tiptap/pm/tables';
import type { TableHandlesState } from './table-handle-plugin';
import { TableHandlePlugin, tableHandlePluginKey } from './table-handle-plugin';

export type { TableHandlesState };

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableHandle: {
      freezeHandles: () => ReturnType;
      unfreezeHandles: () => ReturnType;
    };
  }

  interface EditorEvents {
    tableHandleState: TableHandlesState;
  }
}

export const TableHandleExtension = Extension.create({
  name: 'tableHandleExtension',
  addCommands() {
    return {
      freezeHandles:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(tableHandlePluginKey, true);
          return true;
        },
      unfreezeHandles:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(tableHandlePluginKey, false);
          return true;
        }
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tableReadOnlyGuard'),
        filterTransaction: tr => {
          if (this.editor.isEditable || !tr.selectionSet) {
            return true;
          }
          if (tr.selection instanceof CellSelection) {
            return false;
          }
          if (tr.selection instanceof NodeSelection) {
            const name = tr.selection.node.type.name;
            if (
              name === 'table' ||
              name === 'tableRow' ||
              name === 'tableCell' ||
              name === 'tableHeader'
            ) {
              return false;
            }
          }
          return true;
        }
      }),
      TableHandlePlugin(this.editor, state => {
        this.editor.emit('tableHandleState', state);
      })
    ];
  }
});
