import React, { useEffect } from 'react';
import './index.css';

import 'highlight.js/styles/default.css';
import { ATail } from './extensions/ATail';
import { ATitle } from './extensions/ATitle';
import { AWenHao } from './extensions/AWenHao';
import { StarterKit, StarterKitOptions } from './starter-kit';

import { ParseOptions } from '@tiptap/pm/model';
import { EditorProps } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import { ALink } from './a-link';
import { EditorRender, EditorRenderProps, useEditor } from './editor';
import { createImageUploadExtensions } from './image-upload';
import { MentionNode, NotionMentionMenu } from './notion-like';
import type { FileNodeInfo, FileRenderers, MentionItemsResolver } from './notion-like';

export type UploaderFunc = (
  file: File,
  progressCallBack: (progress: number) => void
) => Promise<string>;

export const mockImgUploader: UploaderFunc = async (file, progressCallBack) => {
  let src = '';
  const reader = new FileReader();
  reader.onload = () => {
    src = reader.result as string;
  };
  reader.readAsDataURL(file);
  console.log('file', file);
  return new Promise(resolve => {
    let mockProgress = 1;
    const t = setInterval(() => {
      mockProgress++;
      progressCallBack(mockProgress * 10);
      if (mockProgress >= 10) {
        clearInterval(t);
        resolve(src);
      }
    }, 300);
  });
};

/** Demo 用文件上传：返回 object URL（仅存 URL，不写 base64） */
export const mockFileUploader: UploaderFunc = async (file, progressCallBack) => {
  const src = URL.createObjectURL(file);
  return new Promise(resolve => {
    let mockProgress = 1;
    const t = setInterval(() => {
      mockProgress++;
      progressCallBack(mockProgress * 10);
      if (mockProgress >= 10) {
        clearInterval(t);
        resolve(src);
      }
    }, 200);
  });
};

export type SimpleConfigureOptions = {
  /** 是否启用标题功能 */
  heading?: false;
  /** 是否启用表格功能 */
  table?: false;
  /** 是否启用图片功能 */
  image?: false;
  /** 是否启用无序列表功能 */
  bulletList?: false;
  /** 是否启用有序列表功能 */
  orderedList?: false;
  /** 是否启用引用块功能 */
  blockquote?: false;
  /** 是否启用代码块功能 */
  codeBlock?: false;
  /** 是否启用水平分割线功能 */
  horizontalRule?: false;
  /** 是否启用加粗功能 */
  bold?: false;
  /** 是否启用斜体功能 */
  italic?: false;
  /** 是否启用删除线功能 */
  strike?: false;
  /** 是否启用行内代码功能 */
  code?: false;
  /** 是否启用文本对齐功能 */
  textAlign?: false;
  /** 是否启用缩进功能 */
  indent?: false;
  /** 是否启用行高功能 */
  lineHeight?: false;
  /** 是否启用文本颜色功能 */
  color?: false;
  /** 是否启用文本高亮功能 */
  highlight?: false;
  /** 是否启用字体大小功能 */
  fontSize?: false;
  /** 是否启用字体类型功能 */
  fontFamily?: false;
  /** 是否启用下标功能 */
  subscript?: false;
  /** 是否启用上标功能 */
  superscript?: false;
  /** 是否启用下划线功能 */
  underline?: false;
  /** 是否启用文本样式功能 */
  textStyle?: false;
};

export type IATiptapProps = Omit<EditorRenderProps, 'editor'> & {
  onChange?: (doc: any, editor: Editor) => void;
  onReady?: (editor: Editor) => void;
  editorProps?: EditorProps;
  parseOptions?: ParseOptions;
  editable?: boolean;
  imageUploader?: UploaderFunc;
  /** Notion 模式：非图片文件上传，返回 URL */
  fileUploader?: UploaderFunc;
  /** Notion 模式：文件块自定义渲染 */
  fileRenderers?: FileRenderers;
  /** Notion 模式：文件块点击 */
  onFileClick?: (info: FileNodeInfo, event: React.MouseEvent) => void;
  starterKitOpt?: StarterKitOptions;
  /**
   * @description 回传模式
   * @default "json"
   */
  mode?: 'html' | 'md' | 'json';
  /**
   * 渲染的模式：公文皮肤 / 普通皮肤 / 自定义 / Notion 块编辑器
   * @default "gov"
   */
  renderMode?: 'normal' | 'gov' | 'custom' | 'notion';
  /**
   * 边框 - 默认预览是有边框的，但是可以设置成无边框模式
   */
  bordered?: boolean;
  /**
   * Notion 块编辑器是否显示头部快捷操作区
   * 可编辑时默认显示，只读模式不显示
   * @default true
   */
  showToolbar?: boolean;
  /**
   * Notion 块编辑器是否显示目录
   * @default true
   */
  showOutline?: boolean;
  /**
   * Notion 块编辑器目录模式：悬浮（悬停展开）或固定（左侧常显，不自动隐藏）
   * @default "float"
   */
  outlineMode?: 'float' | 'fixed';
  onOutlineModeChange?: (mode: 'float' | 'fixed') => void;
  /**
   * @description 富文本的值 字符串或者json
   */
  value?: any;
  /**
   * @description 是否是debug模式 debug会打印一些额外的日志
   */
  debug?: boolean;
  /**
   * @description 编辑器的高度
   */
  height?: number | string;
  /**
   * @description 是否使用简单模式（适用于聊天输入框等场景）
   * @default false
   */
  simple?: boolean;
  /**
   * 编辑器样式
   */
  style?: React.CSSProperties;
  /**
   * @description 简单模式的配置项，可以指定禁用哪些功能
   */
  simpleConfigure?: Partial<SimpleConfigureOptions>;
  /**
   * 启用 @ 提及：传入候选人列表或按 query 解析函数。
   * 有值时注册 mention 节点并挂载 @ 菜单，支持所有渲染模式（含 simple）。
   */
  mentionItems?: MentionItemsResolver;
};

const ATiptapEdit: React.FC<IATiptapProps> = ({
  starterKitOpt,
  parseOptions,
  editorProps,
  mode = 'json',
  onChange,
  debug,
  height = 500,
  value,
  style,
  onReady,
  simple = false,
  renderMode = simple ? 'normal' : 'gov',
  simpleConfigure: userSimpleConfigure,
  imageUploader,
  mentionItems,
  ...props
}) => {
  // 编辑器是否初始化完成
  const [isReady, setIsReady] = React.useState(false);
  // 当前富文本的值
  const [currentValue, setCurrentValue] = React.useState<any | undefined>();
  // 编辑器的高度
  const [editorHeight, setEditorHeight] = React.useState(height);

  useEffect(() => {
    setEditorHeight(height);
  }, [height]);

  const defaultSimpleConfigure: SimpleConfigureOptions = {
    heading: false,
    table: false,
    image: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    codeBlock: false,
    horizontalRule: false
  };

  const finalSimpleConfigure = simple ? { ...defaultSimpleConfigure, ...userSimpleConfigure } : {};
  const starterKitOptions = {
    link: false as const,
    ...(simple ? finalSimpleConfigure : {}),
    ...starterKitOpt
  };
  const imageEnabled = starterKitOptions.image !== false;
  const govBlocksEnabled = !simple && renderMode === 'gov';
  const hasMention = !!mentionItems;

  useEffect(() => {
    setIsReady(false);
  }, [govBlocksEnabled, simple, hasMention]);

  const editor = useEditor(
    {
      menuEnableFullscreen: !simple,
      extensions: [
        ...(simple ? [] : [ATitle]),
        ...(govBlocksEnabled ? [ATail, AWenHao] : []),
        ALink,
        StarterKit.configure(starterKitOptions),
        ...(imageEnabled ? createImageUploadExtensions(imageUploader) : []),
        ...(hasMention ? [MentionNode] : [])
      ],
      onChange: (doc, editorNow) => {
        let strValue: any;
        if (mode === 'json') {
          strValue = doc;
        } else if (mode === 'md') {
          strValue = editorNow.getMarkdown();
        } else {
          strValue = editorNow.getHTML();
        }
        setCurrentValue(strValue);
        onChange?.(strValue, editorNow);
      },
      editorProps: editorProps,
      editable: props.editable,
      parseOptions: parseOptions || {},
      onReady: nowEditor => {
        if (debug) {
          console.log('editor onReady', nowEditor);
        }
        // 切换公文扩展重建时，恢复当前内容
        const initial = value ?? currentValue;
        if (initial) {
          nowEditor.setContent(initial || '');
          setCurrentValue(initial);
        }
        onReady?.(nowEditor);
        setIsReady(true);
      }
    },
    [govBlocksEnabled, simple, hasMention]
  );

  useEffect(() => {
    if (editor?.storage.imageUploader) {
      editor.storage.imageUploader.upload = imageUploader;
    }
  }, [editor, imageUploader]);

  useEffect(() => {
    if (editor) {
      // 更新编辑器的可编辑性
      editor.setEditable(!!props.editable);
      if (props.editable && editor.isEmpty) {
        editor.commands.setContent('<p></p>'); // 设置默认空内容
      }
      if (props.editable) {
        editor.commands.focus('end'); // 切换到编辑模式时自动聚焦
      }
    }
  }, [props.editable]);

  useEffect(() => {
    if (isReady && currentValue !== value) {
      if (debug) {
        console.log('editor setContent', value);
      }
      setCurrentValue(value);
      editor?.setContent(value || '');
    }
  }, [value, isReady]);

  const cssHeight = typeof editorHeight === 'number' ? `${editorHeight}px` : editorHeight;

  return (
    <div
      className={`atiptap_main_${renderMode} atiptap_bordered_${props.editable}_${props.bordered} ${
        simple ? 'atiptap_simple' : ''
      }`}
      style={simple ? ({ '--atiptap-editor-height': cssHeight } as React.CSSProperties) : undefined}
    >
      <EditorRender
        editor={editor}
        style={{
          ...(simple ? {} : { height: editorHeight }),
          ...style
        }}
        showGovBlocks={govBlocksEnabled}
        onFullscreenChange={() => {
          setEditorHeight('100%');
        }}
        {...props}
      />
      {hasMention && <NotionMentionMenu editor={editor} mentionItems={mentionItems} />}
    </div>
  );
};

export default ATiptapEdit;
