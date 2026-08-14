import React from 'react';
import ANotion from './ANotion';
import ATiptapEdit, { IATiptapProps } from './ATiptapEdit';

const ATiptap: React.FC<IATiptapProps> = ({
  onChange,
  renderMode,
  value,
  mode,
  editable,
  imageUploader,
  fileUploader,
  fileRenderers,
  onFileClick,
  onReady,
  style,
  bordered,
  showToolbar,
  showOutline,
  outlineMode,
  onOutlineModeChange,
  className,
  ...props
}) => {
  if (renderMode === 'notion') {
    return (
      <ANotion
        value={value}
        onChange={onChange}
        mode={mode}
        editable={editable}
        imageUploader={imageUploader}
        fileUploader={fileUploader}
        fileRenderers={fileRenderers}
        onFileClick={onFileClick}
        onReady={onReady}
        style={style}
        className={className}
        bordered={bordered}
        showToolbar={showToolbar}
        showOutline={showOutline}
        outlineMode={outlineMode}
        onOutlineModeChange={onOutlineModeChange}
      />
    );
  }

  return (
    <ATiptapEdit
      {...props}
      value={value}
      mode={mode}
      editable={editable}
      imageUploader={imageUploader}
      onReady={onReady}
      style={style}
      className={className}
      bordered={bordered}
      renderMode={renderMode}
      onChange={onChange}
    />
  );
};

export default ATiptap;

