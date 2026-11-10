import React, { forwardRef } from 'react';
import './primitives.css';

const SjInput = forwardRef(function SjInput({
  variant = 'box',
  className = '',
  icon = null,
  type = 'text',
  ...rest
}, ref) {
  const variantClass = {
    underline: 'sj-input-underline',
    pill: 'sj-input-pill',
    box: 'sj-input-box',
  }[variant] || 'sj-input-box';

  if (icon) {
    return (
      <div className="relative flex items-center w-full">
        <span className="absolute left-4 pointer-events-none text-[var(--sj-mute)] flex items-center">
          {icon}
        </span>
        <input
          ref={ref}
          type={type}
          className={`sj-input ${variantClass} pl-11 ${className}`.trim()}
          {...rest}
        />
      </div>
    );
  }

  return (
    <input
      ref={ref}
      type={type}
      className={`sj-input ${variantClass} ${className}`.trim()}
      {...rest}
    />
  );
});

export default SjInput;

