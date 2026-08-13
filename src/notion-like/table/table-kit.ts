import { Extension } from '@tiptap/core';
import type { TableOptions } from '@tiptap/extension-table';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import type { Node } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { cellAround, columnResizing, tableEditing, TableView } from '@tiptap/pm/tables';
import type { ViewMutationRecord } from '@tiptap/pm/view';
import { EMPTY_CELL_WIDTH, RESIZE_MIN_WIDTH } from './tiptap-table-utils';

const TableNode = Table.extend<TableOptions>({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-align': {
        default: null
      }
    };
  },
  addProseMirrorPlugins() {
    const isResizable = this.options.resizable && this.editor.isEditable;
    const defaultCellMinWidth =
      this.options.cellMinWidth < EMPTY_CELL_WIDTH ? EMPTY_CELL_WIDTH : this.options.cellMinWidth;

    return [
      ...(isResizable
        ? [
            columnResizing({
              handleWidth: this.options.handleWidth,
              cellMinWidth: RESIZE_MIN_WIDTH,
              defaultCellMinWidth,
              View: null,
              lastColumnResizable: this.options.lastColumnResizable
            })
          ]
        : []),
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection
      })
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      class NotionTableView extends TableView {
        private readonly blockContainer: HTMLDivElement;
        private readonly innerTableContainer: HTMLDivElement;
        private readonly widgetsContainer: HTMLDivElement;
        private readonly overlayContainer: HTMLDivElement;
        declare readonly node: Node;
        declare readonly minCellWidth: number;
        private readonly containerAttributes: Record<string, string>;

        constructor(
          currentNode: Node,
          minCellWidth: number,
          containerAttributes: Record<string, string>
        ) {
          super(currentNode, minCellWidth);
          this.containerAttributes = containerAttributes ?? {};
          this.blockContainer = document.createElement('div');
          this.blockContainer.setAttribute('data-content-type', 'table');
          Object.entries(this.containerAttributes).forEach(([key, value]) => {
            if (key !== 'class') {
              this.blockContainer.setAttribute(key, value);
            }
          });
          this.innerTableContainer = document.createElement('div');
          this.innerTableContainer.className = 'table-container';
          this.widgetsContainer = document.createElement('div');
          this.widgetsContainer.className = 'table-controls';
          this.widgetsContainer.style.position = 'relative';
          this.overlayContainer = document.createElement('div');
          this.overlayContainer.className = 'table-selection-overlay-container';

          const originalTable = this.dom;
          const tableElement = originalTable.firstChild!;
          this.innerTableContainer.appendChild(tableElement);
          originalTable.appendChild(this.innerTableContainer);
          originalTable.appendChild(this.widgetsContainer);
          originalTable.appendChild(this.overlayContainer);
          this.blockContainer.appendChild(originalTable);
          this.dom = this.blockContainer;
        }

        ignoreMutation(mutation: ViewMutationRecord): boolean {
          const target = mutation.target as HTMLElement;
          const isInsideTable = target.closest('.table-container');
          return !isInsideTable || super.ignoreMutation(mutation);
        }
      }

      const cellMinWidth =
        this.options.cellMinWidth < EMPTY_CELL_WIDTH ? EMPTY_CELL_WIDTH : this.options.cellMinWidth;
      return new NotionTableView(node, cellMinWidth, HTMLAttributes);
    };
  }
});

const TableCellNode = TableCell.extend({
  content: '(paragraph | heading | blockquote | list | codeBlock | image | horizontalRule)+',
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      'Mod-a': () => {
        const { state, view } = this.editor;
        const { selection, doc } = state;
        const cellPos = cellAround(selection.$anchor);
        if (!cellPos) {
          return false;
        }
        const cellNode = doc.nodeAt(cellPos.pos);
        if (!cellNode?.textContent) {
          return false;
        }
        const from = cellPos.pos + 1;
        const to = cellPos.pos + cellNode.nodeSize - 1;
        if (from >= to) {
          return true;
        }
        const nextSel = TextSelection.between(doc.resolve(from), doc.resolve(to), 1);
        if (!nextSel || state.selection.eq(nextSel)) {
          return true;
        }
        view.dispatch(state.tr.setSelection(nextSel));
        return true;
      }
    };
  }
});

export const NotionTableKit = Extension.create({
  name: 'notionTableKit',
  addExtensions() {
    return [
      TableNode.configure({
        resizable: true,
        cellMinWidth: EMPTY_CELL_WIDTH,
        allowTableNodeSelection: true
      }),
      TableRow,
      TableCellNode,
      TableHeader
    ];
  }
});
