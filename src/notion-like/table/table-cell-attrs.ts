import type { NodeWithPos } from '@tiptap/core';
import { Extension } from '@tiptap/core';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import { getSelectedNodesOfType, updateNodesAttr } from './pm-utils';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nodeBackground: {
      setNodeBackgroundColor: (backgroundColor: string) => ReturnType;
      unsetNodeBackgroundColor: () => ReturnType;
    };
    nodeAlignment: {
      setNodeTextAlign: (textAlign: string) => ReturnType;
      setNodeVAlign: (verticalAlign: string) => ReturnType;
      unsetNodeAlignment: () => ReturnType;
    };
  }
}

const CELL_TYPES = ['tableCell', 'tableHeader'];

export const TableCellAttrs = Extension.create({
  name: 'tableCellAttrs',

  addGlobalAttributes() {
    return [
      {
        types: CELL_TYPES,
        attributes: {
          backgroundColor: {
            default: null as string | null,
            parseHTML: (element: HTMLElement) =>
              element.style?.backgroundColor || element.getAttribute('data-background-color'),
            renderHTML: attributes => {
              if (!attributes.backgroundColor) return {};
              return { style: `background-color: ${attributes.backgroundColor}` };
            }
          },
          nodeTextAlign: {
            default: null as string | null,
            parseHTML: (element: HTMLElement) =>
              element.style?.textAlign || element.getAttribute('data-node-text-align'),
            renderHTML: attributes => {
              if (!attributes.nodeTextAlign) return {};
              return { style: `text-align: ${attributes.nodeTextAlign}` };
            }
          },
          nodeVerticalAlign: {
            default: null as string | null,
            parseHTML: (element: HTMLElement) =>
              element.style?.verticalAlign || element.getAttribute('data-node-vertical-align'),
            renderHTML: attributes => {
              if (!attributes.nodeVerticalAlign) return {};
              return { style: `vertical-align: ${attributes.nodeVerticalAlign}` };
            }
          }
        }
      }
    ];
  },

  addCommands() {
    const runAttr = (attr: string, value: unknown) => {
      return ({ state, tr }: { state: EditorState; tr: Transaction }) => {
        const targets = getSelectedNodesOfType(state.selection, CELL_TYPES);
        if (!targets.length) {
          return false;
        }
        return updateNodesAttr(tr, targets as NodeWithPos[], attr, value);
      };
    };

    return {
      setNodeBackgroundColor: color => runAttr('backgroundColor', color),
      unsetNodeBackgroundColor: () => runAttr('backgroundColor', null),
      setNodeTextAlign: align => runAttr('nodeTextAlign', align),
      setNodeVAlign: align => runAttr('nodeVerticalAlign', align),
      unsetNodeAlignment:
        () =>
        ({ state, tr }) => {
          const targets = getSelectedNodesOfType(state.selection, CELL_TYPES);
          if (!targets.length) return false;
          updateNodesAttr(tr, targets, 'nodeTextAlign', null);
          updateNodesAttr(tr, targets, 'nodeVerticalAlign', null);
          return true;
        }
    };
  }
});
