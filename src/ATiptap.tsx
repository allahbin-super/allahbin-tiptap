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
  onReady,
  style,
  bordered,
  showToolbar,
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
        onReady={onReady}
        style={style}
        className={className}
        bordered={bordered}
        showToolbar={showToolbar}
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
