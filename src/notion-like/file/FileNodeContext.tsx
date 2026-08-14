import React, { createContext, useContext } from 'react';
import type { UploaderFunc } from '../../image-upload';
import type { FileKind } from './file-kind';

export type FileNodeInfo = {
  kind: FileKind;
  src: string;
  name: string;
  mime: string;
  size?: number | null;
};

export type FileNodeRenderProps = FileNodeInfo & {
  selected: boolean;
  defaultRender: () => React.ReactNode;
};

export type FileRenderers = {
  video?: (props: FileNodeRenderProps) => React.ReactNode;
  audio?: (props: FileNodeRenderProps) => React.ReactNode;
  file?: (props: FileNodeRenderProps) => React.ReactNode;
};

export type FileNodeContextValue = {
  fileUploader?: UploaderFunc;
  fileRenderers?: FileRenderers;
  onFileClick?: (info: FileNodeInfo, event: React.MouseEvent) => void;
};

const FileNodeContext = createContext<FileNodeContextValue>({});

export const FileNodeProvider: React.FC<
  FileNodeContextValue & { children: React.ReactNode }
> = ({ children, ...value }) => (
  <FileNodeContext.Provider value={value}>{children}</FileNodeContext.Provider>
);

export function useFileNodeContext(): FileNodeContextValue {
  return useContext(FileNodeContext);
}
