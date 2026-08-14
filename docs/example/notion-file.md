---
title: 附件与音视频
order: 6
---

# 附件 / 视频 / 音频

ANotion 用**一个** `file` 节点承载非图片媒体，按 MIME 自动切换展示。图片仍走独立的 `image` 节点（缩放、对齐、图注）。

文档**只存 URL**（以及 `name` / `mime` / `size`），不写入原始文件、blob 或非图片 base64。

## 快速接入

```tsx | pure
import { ANotion, mockFileUploader, mockImgUploader } from '@allahbin/tiptap';

<ANotion
  value={markdown}
  onChange={setMarkdown}
  imageUploader={mockImgUploader}
  // 非图片必填：上传后返回可访问的 URL
  fileUploader={async (file, onProgress) => {
    const url = await uploadToOss(file, onProgress);
    return url;
  }}
  onFileClick={(info, event) => {
    event.preventDefault();
    // 预览、下载鉴权、打开业务 Viewer
    openPreview(info);
  }}
/>
```

未配置 `fileUploader` 时：斜杠仍可插入上传占位，但会提示「未配置上传」，且**不会**把视频/附件写进文档。图片可继续只用 `imageUploader`；若只传了 `fileUploader`，图片也会回退用它。

## 插入入口

| 入口 | 行为 |
| --- | --- |
| 斜杠 `/` → 视频 / 音频 / 文件 | 插入 `fileUpload` 占位，`accept` 分别为 `video/*` / `audio/*` / `*/*` |
| 工具栏回形针 | 插入通用文件占位 |
| 粘贴 / 拖放 | `image/*` → `image` 节点；其它 → `file` 节点（需 `fileUploader`） |
| 快捷键 `Mod+Shift+F` | 插入文件占位 |

上传完成后按 MIME 落盘：

- `image/*` → `image`（占位若选到图片时）
- `video/*` → `file`，运行时 `kind=video`
- `audio/*` → `file`，运行时 `kind=audio`
- 其它 → `file`，运行时 `kind=file`

`kind` **不入库**，由 `mime` / 扩展名推导，改渲染规则不用迁文档。

## 文档结构

JSON：

```json
{
  "type": "file",
  "attrs": {
    "src": "https://cdn.example.com/a.mp4",
    "name": "a.mp4",
    "mime": "video/mp4",
    "size": 123456
  }
}
```

HTML 往返：

- 视频 → `<video src controls data-file-name data-file-mime data-file-size>`
- 音频 → `<audio src controls …>`
- 其它 → `<a data-type="file" href …>`

Markdown 模式第一版通过 HTML 片段往返；不要把视频写成 `![](url)`，以免和图片混淆。

## 默认展示

视觉跟 antd token（主色 `#1677ff`、边框 `#d9d9d9`），不是 Notion 暖灰。

| kind | 默认 UI |
| --- | --- |
| `video` | 原生 `<video controls>` + 标题条 |
| `audio` | 原生 `<audio controls>` + 标题条 |
| `file` | 附件卡片：图标 + 文件名 + 体积 / MIME |

点击约定：

- **附件卡片**：有 `onFileClick` 则回调，否则 `window.open(src)`
- **视频 / 音频控件**（播放、进度条）：不拦截，避免抢原生播放器
- **播放器标题条**：可走 `onFileClick`（未传则无额外跳转）
- 节点选中仍归编辑器（拖拽句柄等）

## 自定义渲染

通过 `fileRenderers` 按 kind 覆盖；不传的 kind 用默认。业务要做 PDF 预览等，写在 `file` 里自行判断 `mime` 即可（第一版不单独加 `pdf` kind）。

```tsx | pure
<ANotion
  fileUploader={fileUploader}
  fileRenderers={{
    video: props => props.defaultRender(),
    audio: props => props.defaultRender(),
    file: props => {
      if (props.mime === 'application/pdf') {
        return <MyPdfViewer src={props.src} name={props.name} />;
      }
      return props.defaultRender();
    }
  }}
  onFileClick={(info, event) => {
    event.preventDefault();
    openPreview(info);
  }}
/>
```

渲染回调参数：

```ts
type FileNodeRenderProps = {
  kind: 'video' | 'audio' | 'file';
  src: string;
  name: string;
  mime: string;
  size?: number | null;
  selected: boolean;
  defaultRender: () => React.ReactNode;
};
```

## 只读渲染（TiptapRender）

JSON 预览同样支持 `file` 节点，配置写在 `IRenderConfig`：

```tsx | pure
import { TiptapRender } from '@allahbin/tiptap';

new TiptapRender(json, {
  fileRenderers: { /* 同上 */ },
  onFileClick: info => openPreview(info)
}).render();
```

## Props 一览

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `fileUploader` | `(file, onProgress) => Promise<string>` | 非图片上传，返回 URL |
| `imageUploader` | 同上 | 图片上传；可缺省并回退到 `fileUploader` |
| `fileRenderers` | `{ video?, audio?, file? }` | 按 kind 自定义 NodeView |
| `onFileClick` | `(info, event) => void` | 点击回调 |

导出类型：`FileKind`、`FileNodeInfo`、`FileNodeRenderProps`、`FileRenderers`（见 `@allahbin/tiptap`）。

Demo 还提供 `mockFileUploader`（返回 object URL，仅本地演示，不要当生产存储）。

## 在线示例

<code src="../../example/notion-file.tsx"></code>
