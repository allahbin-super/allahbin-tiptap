import type { NodeWithPos } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { NodeSelection, type Selection, type Transaction } from '@tiptap/pm/state';
import { CellSelection, cellAround } from '@tiptap/pm/tables';

export function isValidPosition(pos: number | null | undefined): pos is number {
  return typeof pos === 'number' && pos >= 0;
}

export function updateNodesAttr<A extends string = string, V = unknown>(
  tr: Transaction,
  targets: readonly NodeWithPos[],
  attrName: A,
  next: V | ((prev: V | undefined) => V | undefined)
): boolean {
  if (!targets.length) {
    return false;
  }
  let changed = false;
  for (const { pos } of targets) {
    const currentNode = tr.doc.nodeAt(pos);
    if (!currentNode) {
      continue;
    }
    const prevValue = (currentNode.attrs as Record<string, unknown>)[attrName] as V | undefined;
    const resolvedNext =
      typeof next === 'function' ? (next as (p: V | undefined) => V | undefined)(prevValue) : next;
    if (prevValue === resolvedNext) {
      continue;
    }
    const nextAttrs: Record<string, unknown> = { ...currentNode.attrs };
    if (resolvedNext === undefined) {
      delete nextAttrs[attrName];
    } else {
      nextAttrs[attrName] = resolvedNext;
    }
    tr.setNodeMarkup(pos, undefined, nextAttrs);
    changed = true;
  }
  return changed;
}

export function getSelectedNodesOfType(
  selection: Selection,
  allowedNodeTypes: string[]
): NodeWithPos[] {
  const results: NodeWithPos[] = [];
  const allowed = new Set(allowedNodeTypes);

  if (selection instanceof CellSelection) {
    selection.forEachCell((node: PMNode, pos: number) => {
      if (allowed.has(node.type.name)) {
        results.push({ node, pos });
      }
    });
    return results;
  }

  if (selection instanceof NodeSelection) {
    const { node, from: pos } = selection;
    if (node && allowed.has(node.type.name)) {
      results.push({ node, pos });
    }
    return results;
  }

  const cell = cellAround(selection.$anchor);
  if (cell) {
    const cellNode = selection.$anchor.doc.nodeAt(cell.pos);
    if (cellNode && allowed.has(cellNode.type.name)) {
      results.push({ node: cellNode, pos: cell.pos });
    }
  }
  return results;
}
