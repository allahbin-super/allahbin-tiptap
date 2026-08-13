import classNames from 'classnames';
import React, { forwardRef } from 'react';

export type ButtonProps = {
  disabled?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties | undefined;
  className?: string;
};

const TextButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ disabled, style, isActive, children, onClick, className }, ref) => {
    return (
      <button
        style={style}
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={classNames(
          'atiptap-menu-bar__btn',
          {
            'atiptap-menu-bar__btn--active': isActive,
            'atiptap-menu-bar__btn--disabled': disabled
          },
          className
        )}
      >
        {children}
      </button>
    );
  }
);

TextButton.displayName = 'TextButton';

export default TextButton;
