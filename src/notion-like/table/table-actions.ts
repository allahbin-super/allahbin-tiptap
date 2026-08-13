import type { Node } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';
import {
  addColumnAfter,
  addRowAfter,
  CellSelection,
  deleteCellSelection,
  mergeCells,
  moveTableColumn,
  moveTableRow,
  splitCell,
  toggleHeader
} from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/react';
import type { Orientation } from './tiptap-table-utils';
import {
  getIndexCoordinates,
  getRowOrColumnCells,
  getTable,
  isCellEmpty,
  RESIZE_MIN_WIDTH,
  selectCellsByCoords,
  updateSelectionAfterAction
} from './tiptap-table-utils';

export function selectRowOrColumn(
  editor: Editor,
  tablePos: number,
  orientation: Orientation,
  index: number
) {
  const table = getTable(editor, tablePos);
  if (!table) {
    return;
  }
  const start = orientation === 'row' ? { row: index, col: 0 } : { row: 0, col: index };
  const end =
    orientation === 'row'
      ? { row: index, col: table.map.width - 1 }
      : { row: table.map.height - 1, col: index };
  selectCellsByCoords(editor, tablePos, [start, end], {
    mode: 'dispatch',
    dispatch: editor.view.dispatch.bind(editor.view)
  });
}

export function addRowOrColumn(
  editor: Editor,
  orientation: Orientation,
  where: 'before' | 'after'
) {
  if (orientation === 'row') {
    return where === 'before'
      ? editor.chain().focus().addRowBefore().run()
      : editor.chain().focus().addRowAfter().run();
  }
  return where === 'before'
    ? editor.chain().focus().addColumnBefore().run()
    : editor.chain().focus().addColumnAfter().run();
}

export function deleteRowOrColumn(editor: Editor, orientation: Orientation) {
  return orientation === 'row'
    ? editor.chain().focus().deleteRow().run()
    : editor.chain().focus().deleteColumn().run();
}

export function toggleHeaderRowOrColumn(editor: Editor, orientation: Orientation) {
  const type = orientation === 'row' ? 'row' : 'column';
  return toggleHeader(type)(editor.state, editor.view.dispatch);
}

export function moveIndexedRowOrColumn(
  editor: Editor,
  orientation: Orientation,
  index: number,
  direction: 'up' | 'down' | 'left' | 'right',
  tablePos?: number
) {
  const table = getTable(editor, tablePos);
  if (!table) {
    return false;
  }
  const delta = direction === 'up' || direction === 'left' ? -1 : 1;
  const to = index + delta;
  if (to < 0) {
    return false;
  }
  const dispatch = (transaction: Transaction) => editor.view.dispatch(transaction);
  const moveOperation = orientation === 'row' ? moveTableRow : moveTableColumn;
  return moveOperation({ from: index, to, select: true, pos: table.start })(editor.state, dispatch);
}

export function duplicateRowOrColumn(
  editor: Editor,
  orientation: Orientation,
  index: number,
  tablePos?: number
) {
  const original = getRowOrColumnCells(editor, index, orientation, tablePos);
  if (!original.cells.length || original.mergedCells.length) {
    return false;
  }
  let addSuccess = false;
  if (editor.state.selection instanceof CellSelection) {
    addSuccess =
      orientation === 'row'
        ? editor.chain().focus().addRowAfter().run()
        : editor.chain().focus().addColumnAfter().run();
  } else if (tablePos !== undefined && tablePos !== null) {
    const coords = getIndexCoordinates({ editor, index, orientation, tablePos });
    if (!coords) {
      return false;
    }
    const state = selectCellsByCoords(editor, tablePos, coords, { mode: 'state' });
    addSuccess =
      orientation === 'row'
        ? addRowAfter(state, editor.view.dispatch)
        : addColumnAfter(state, editor.view.dispatch);
  }
  if (!addSuccess) {
    return false;
  }
  const next = getRowOrColumnCells(editor, index + 1, orientation, tablePos);
  const tr = editor.state.tr;
  const cellsToReplace = [...next.cells].reverse();
  const originalCells = [...original.cells].reverse();
  cellsToReplace.forEach((newCell, reverseIndex) => {
    const source = originalCells[reverseIndex];
    if (newCell.node && source?.node) {
      const duplicated = newCell.node.type.create(
        { ...source.node.attrs },
        source.node.content,
        source.node.marks
      );
      tr.replaceWith(newCell.pos, newCell.pos + newCell.node.nodeSize, duplicated);
    }
  });
  if (!tr.docChanged) {
    return false;
  }
  editor.view.dispatch(tr);
  updateSelectionAfterAction(editor, orientation, index + 1, tablePos);
  return true;
}

function getCellSortText(cellNode: Node | null): string {
  if (!cellNode) return '';
  let text = '';
  cellNode.descendants(node => {
    if (node.isText) text += node.text || '';
    return true;
  });
  return text.trim().toLowerCase();
}

export function sortRowOrColumn(
  editor: Editor,
  orientation: Orientation,
  index: number,
  direction: 'asc' | 'desc',
  tablePos?: number
) {
  const cellData = getRowOrColumnCells(editor, index, orientation, tablePos);
  if (cellData.mergedCells.length || cellData.cells.length < 2) {
    return false;
  }
  const items = cellData.cells.map((cellInfo, originalIndex) => ({
    sortText: getCellSortText(cellInfo.node),
    originalNode: cellInfo.node,
    isHeader: cellInfo.node?.type.name === 'tableHeader',
    isEmpty: cellInfo.node ? isCellEmpty(cellInfo.node) : true,
    originalIndex
  }));
  const dataItems = items.filter(item => !item.isHeader);
  dataItems.sort((a, b) => {
    if (a.isEmpty && !b.isEmpty) return 1;
    if (!a.isEmpty && b.isEmpty) return -1;
    const comparison = a.sortText.localeCompare(b.sortText, undefined, { sensitivity: 'base' });
    return direction === 'asc' ? comparison : -comparison;
  });
  const newNodes: Node[] = [];
  let dataIndex = 0;
  items.forEach((item, i) => {
    const target = cellData.cells[i];
    const nodeToPlace = item.isHeader ? item.originalNode : dataItems[dataIndex++]?.originalNode;
    if (nodeToPlace && target.node) {
      newNodes.push(
        target.node.type.create(nodeToPlace.attrs, nodeToPlace.content, nodeToPlace.marks)
      );
    } else if (target.node) {
      newNodes.push(target.node);
    }
  });
  const tr = editor.state.tr;
  [...cellData.cells].reverse().forEach((target, reverseIndex) => {
    const newNode = [...newNodes].reverse()[reverseIndex];
    if (newNode && target.node) {
      tr.replaceWith(target.pos, target.pos + target.node.nodeSize, newNode);
    }
  });
  if (!tr.docChanged) {
    return false;
  }
  editor.view.dispatch(tr);
  return true;
}

export function clearRowOrColumn(
  editor: Editor,
  orientation: Orientation,
  index: number,
  tablePos?: number
) {
  const cells = getRowOrColumnCells(editor, index, orientation, tablePos).cells;
  const tr = editor.state.tr;
  cells.forEach(cell => {
    if (!cell.node) return;
    const empty = cell.node.type.create(
      {
        ...cell.node.attrs,
        backgroundColor: null,
        nodeTextAlign: null,
        nodeVerticalAlign: null
      },
      cell.node.type.schema.nodes.paragraph.create()
    );
    tr.replaceWith(cell.pos, cell.pos + cell.node.nodeSize, empty);
  });
  if (!tr.docChanged) {
    return false;
  }
  editor.view.dispatch(tr);
  return true;
}

export function clearSelectedCells(editor: Editor) {
  if (editor.state.selection instanceof CellSelection) {
    return deleteCellSelection(editor.state, editor.view.dispatch);
  }
  return editor.chain().focus().unsetNodeBackgroundColor().unsetNodeAlignment().run();
}

export function mergeOrSplitCells(editor: Editor, action: 'merge' | 'split') {
  return action === 'merge'
    ? mergeCells(editor.state, editor.view.dispatch)
    : splitCell(editor.state, editor.view.dispatch);
}

export function canMergeCells(editor: Editor) {
  try {
    return mergeCells(editor.state, undefined);
  } catch {
    return false;
  }
}

export function canSplitCell(editor: Editor) {
  try {
    return splitCell(editor.state, undefined);
  } catch {
    return false;
  }
}

export function setTableAlign(editor: Editor, align: 'left' | 'center' | 'right') {
  return editor.chain().focus().updateAttributes('table', { 'data-align': align }).run();
}

export function fitTableToWidth(editor: Editor) {
  const table = getTable(editor);
  if (!table) {
    return false;
  }
  const editorElement = editor.view.dom as HTMLElement;
  const style = getComputedStyle(editorElement);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const editorWidth = editorElement.clientWidth - paddingLeft - paddingRight;
  const columnCount = table.map.width;
  if (!columnCount) {
    return false;
  }
  const finalColWidth = Math.max(
    Math.floor((editorWidth - columnCount - 8) / columnCount),
    RESIZE_MIN_WIDTH
  );
  const tr = editor.state.tr;
  table.node.descendants((child, childPos) => {
    if (child.type.name === 'tableCell' || child.type.name === 'tableHeader') {
      const colspan = child.attrs.colspan || 1;
      tr.setNodeMarkup(table.start + childPos, undefined, {
        ...child.attrs,
        colwidth: Array(colspan).fill(finalColWidth)
      });
    }
  });
  if (!tr.docChanged) {
    return false;
  }
  editor.view.dispatch(tr);
  return true;
}

export function clearEntireTable(editor: Editor, tablePos?: number) {
  const table = getTable(editor, tablePos);
  if (!table) {
    return false;
  }
  const tr = editor.state.tr;
  table.node.descendants((child, childPos) => {
    if (child.type.name === 'tableCell' || child.type.name === 'tableHeader') {
      const empty = child.type.create(
        {
          ...child.attrs,
          backgroundColor: null,
          nodeTextAlign: null,
          nodeVerticalAlign: null
        },
        child.type.schema.nodes.paragraph.create()
      );
      const pos = table.start + childPos;
      tr.replaceWith(pos, pos + child.nodeSize, empty);
    }
  });
  if (!tr.docChanged) {
    return false;
  }
  editor.view.dispatch(tr);
  return true;
}
