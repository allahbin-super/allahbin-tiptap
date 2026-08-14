import React from 'react';
import TextButton from '../extensions/TextButton';

export type AWenHaoBarProps = {
  className?: string;
  style?: React.CSSProperties;
  title?: string | undefined;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
};

export const AWenHaoBar: React.FC<AWenHaoBarProps> = ({
  className,
  style,
  onClick,
  isActive,
  disabled
}) => {
  return (
    <TextButton
      className="atiptap-menu-bar__btn--wide"
      title="文号"
      onClick={onClick}
      isActive={isActive}
      disabled={disabled}
      style={style}
    >
      <span className={className}>文号</span>
    </TextButton>
  );
};
