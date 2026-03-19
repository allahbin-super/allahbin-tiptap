import { Extension, Extensions } from '@tiptap/core';
import { Blockquote, BlockquoteOptions } from '@tiptap/extension-blockquote';
import { Bold, BoldOptions } from '@tiptap/extension-bold';
import { Code, CodeOptions } from '@tiptap/extension-code';
import { CodeBlock, CodeBlockOptions } from '@tiptap/extension-code-block';
import { Document } from '@tiptap/extension-document';
import { HardBreak, HardBreakOptions } from '@tiptap/extension-hard-break';
import { Heading, HeadingOptions } from '@tiptap/extension-heading';
import { HorizontalRule, HorizontalRuleOptions } from '@tiptap/extension-horizontal-rule';
import { Image, ImageOptions } from '@tiptap/extension-image';
import { Italic, ItalicOptions } from '@tiptap/extension-italic';
import {
  BulletList,
  BulletListOptions,
  ListItem,
  ListItemOptions,
  OrderedList,
  OrderedListOptions,
  TaskItem,
  TaskItemOptions,
  TaskList,
  TaskListOptions
} from '@tiptap/extension-list';
import { Link, LinkOptions } from '@tiptap/extension-link';
import { Paragraph, ParagraphOptions } from '@tiptap/extension-paragraph';
import { Strike, StrikeOptions } from '@tiptap/extension-strike';
import { Table, TableOptions } from '@tiptap/extension-table';
import { TableCell, TableCellOptions } from '@tiptap/extension-table-cell';
import { TableHeader, TableHeaderOptions } from '@tiptap/extension-table-header';
import { TableRow, TableRowOptions } from '@tiptap/extension-table-row';
import { Text } from '@tiptap/extension-text';
import { TextAlign, TextAlignOptions } from '@tiptap/extension-text-align';
import { Dropcursor, DropcursorOptions, Gapcursor, UndoRedo, UndoRedoOptions } from '@tiptap/extensions';
import { Markdown, MarkdownOptions } from '../markdown';

export interface StarterKitOptions {
  commands: false;
  highPriorityKeymap: false;
  lowPriorityKeymap: false;
  document: false;
  paragraph: Partial<ParagraphOptions> | false;
  text: false;
  textAlign: Partial<TextAlignOptions> | false;
  bold: Partial<BoldOptions> | false;
  italic: Partial<ItalicOptions> | false;
  strike: Partial<StrikeOptions> | false;
  code: Partial<CodeOptions> | false;
  link: Partial<LinkOptions> | false;
  heading: Partial<HeadingOptions> | false;
  blockquote: Partial<BlockquoteOptions> | false;
  hardBreak: Partial<HardBreakOptions> | false;
  horizontalRule: Partial<HorizontalRuleOptions> | false;
  listsIndentation: Record<string, any> | false;
  indentation: Record<string, any> | false;
  bulletList: Partial<BulletListOptions> | false;
  orderedList: Partial<OrderedListOptions> | false;
  listItem: Partial<ListItemOptions>;
  taskList: Partial<TaskListOptions> | false;
  taskItem: Partial<TaskItemOptions>;
  table: Partial<TableOptions> | false;
  tableRow: Partial<TableRowOptions>;
  tableCell: Partial<TableCellOptions>;
  tableHeader: Partial<TableHeaderOptions>;
  codeBlock: Partial<CodeBlockOptions> | false;
  image: Partial<ImageOptions> | false;
  emoji: Record<string, any> | false;
  history: Partial<UndoRedoOptions> | false;
  dropcursor: Partial<DropcursorOptions> | false;
  gapcursor: false;
  uploader: Record<string, any> | false;
  markdown: Partial<MarkdownOptions> | false;
}

export const StarterKit = Extension.create<StarterKitOptions>({
  name: 'starterKit',

  addExtensions() {
    const extensions: Extensions = [];
    const tableCellContent: string[] = [];

    if (this.options.document !== false) {
      extensions.push(Document);
    }

    if (this.options.paragraph !== false) {
      extensions.push(Paragraph.configure(this.options.paragraph));
      tableCellContent.push('paragraph');
    }

    if (this.options.text !== false) {
      extensions.push(Text);
    }

    if (this.options.textAlign !== false) {
      extensions.push(
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          ...this.options.textAlign
        })
      );
    }

    if (this.options.bold !== false) {
      extensions.push(Bold.configure(this.options.bold));
    }

    if (this.options.italic !== false) {
      extensions.push(Italic.configure(this.options.italic));
    }

    if (this.options.strike !== false) {
      extensions.push(Strike.configure(this.options.strike));
    }

    if (this.options.code !== false) {
      extensions.push(Code.configure(this.options.code));
    }

    if (this.options.link !== false) {
      extensions.push(Link.configure(this.options.link));
    }

    if (this.options.heading !== false) {
      extensions.push(Heading.configure(this.options.heading));
      tableCellContent.push('heading');
    }

    if (this.options.blockquote !== false) {
      extensions.push(Blockquote.configure(this.options.blockquote));
      tableCellContent.push('blockquote');
    }

    if (this.options.hardBreak !== false) {
      extensions.push(HardBreak.configure(this.options.hardBreak));
    }

    if (this.options.horizontalRule !== false) {
      extensions.push(HorizontalRule.configure(this.options.horizontalRule));
      tableCellContent.push('horizontalRule');
    }

    if (this.options.bulletList !== false) {
      extensions.push(BulletList.configure(this.options.bulletList));
    }

    if (this.options.orderedList !== false) {
      extensions.push(OrderedList.configure(this.options.orderedList));
    }

    if (this.options.bulletList !== false || this.options.orderedList !== false) {
      extensions.push(ListItem.configure(this.options.listItem));
    }

    if (this.options.taskList !== false) {
      extensions.push(TaskList.configure(this.options.taskList));
      extensions.push(TaskItem.configure(this.options.taskItem));
    }

    if (
      this.options.bulletList !== false ||
      this.options.orderedList !== false ||
      this.options.taskList !== false
    ) {
      tableCellContent.push('list');
    }

    if (this.options.codeBlock !== false) {
      extensions.push(CodeBlock.configure(this.options.codeBlock));
      tableCellContent.push('codeBlock');
    }

    if (this.options.image !== false) {
      extensions.push(Image.configure(this.options.image));
      tableCellContent.push('image');
    }

    if (this.options.table !== false) {
      const TableCellExtension = TableCell.extend({
        content: `(${tableCellContent.join(' | ')})+`
      });
      extensions.push(Table.configure(this.options.table));
      extensions.push(TableRow.configure(this.options.tableRow));
      extensions.push(TableCellExtension.configure(this.options.tableCell));
      extensions.push(TableHeader.configure(this.options.tableHeader));
    }

    if (this.options.history !== false) {
      extensions.push(UndoRedo.configure(this.options.history));
    }

    if (this.options.dropcursor !== false) {
      extensions.push(Dropcursor.configure(this.options.dropcursor));
    }

    if (this.options.gapcursor !== false) {
      extensions.push(Gapcursor);
    }

    if (this.options.markdown !== false) {
      extensions.push(
        Markdown.configure({
          linkify: true,
          breaks: true,
          tightLists: true,
          paste: true,
          copy: false,
          ...this.options.markdown
        })
      );
    }

    return extensions;
  }
});
