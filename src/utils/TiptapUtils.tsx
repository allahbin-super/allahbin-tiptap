import 'highlight.js/styles/default.css';
import { ITiptapJson } from '../editor';
import TiptapRender, { IRenderConfig } from './TiptapRender';

// 定义段落的数组，也就是占一行的类型有哪些
export const paragraphTypes = [
  'paragraph',
  'ATitle',
  'ATail',
  'AWenHao',
  'heading',
  'codeBlock',
  'horizontalRule',
  'hardBreak'
];

// 渲染的对象池
let renderPool: TiptapRender | null = null;

// 将json数据转成dom
export const jsonToDom = (json: ITiptapJson, config?: IRenderConfig) => {
  if (renderPool) {
    renderPool.setJson(json);
    renderPool.setConfig(config);
  } else {
    renderPool = new TiptapRender(json, config);
  }
  return renderPool.render();
};

// 从blockJson中获取所有的heading或者ATitle，然后返回成一个树数据，根据level的等级来进行排序，比如level为2的就是在1的子集，如果level为3就是在2的子集
export const generateDirectoryTree = (jsonData: ITiptapJson): any[] => {
  if (!jsonData) {
    return [];
  }
  let key = 1;
  const data = jsonData.content;
  const directoryTree = [];
  // 先查询下最大的level
  const maxLevel = data.reduce((max, item) => {
    if (item.type === 'ATitle' || item.type === 'heading') {
      return Math.max(max, item.attrs.level);
    }
    return max;
  }, 0);
  for (let i = 0; i < data.length; i++) {
    const newKey = key++;
    const item = data[i];
    if (item.type === 'ATitle' || item.type === 'heading') {
      const node: any = {
        title: item.content[0].text,
        label: item.content[0].text,
        key: `${newKey}`,
        value: `${newKey}`,
        isLeaf: true,
        children: [],
        pcode: '-1'
      };
      if (maxLevel === 1) {
        if (item.attrs.level === 1) {
          directoryTree.push(node);
        } else if (item.attrs.level === 2) {
          if (directoryTree.length > 0) {
            const parent = directoryTree[directoryTree.length - 1];
            node.pcode = parent.value;
            node.isLeaf = false;
            parent.children!.push(node);
          }
        }
      } else {
        directoryTree.push(node);
      }
    }
  }
  return directoryTree;
};
