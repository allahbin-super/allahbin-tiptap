import React from 'react';
import TextButton from './TextButton';

export type ATailBarProps = {
  className?: string;
  style?: React.CSSProperties;
  title?: string | undefined;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
};

export const ATailBar: React.FC<ATailBarProps> = ({ className, style, onClick, isActive, disabled }) => {
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
      <span className={className}>落款</span>
    </TextButton>
  );
};
