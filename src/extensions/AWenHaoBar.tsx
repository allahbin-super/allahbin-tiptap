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
      onClick={onClick}
      isActive={isActive}
      disabled={disabled}
      style={{
        width: 48,
        justifyContent: 'center',
        display: 'flex',
        alignItems: 'center',
        ...style
      }}
    >
      <span className={className}>文号</span>
    </TextButton>
  );
};
