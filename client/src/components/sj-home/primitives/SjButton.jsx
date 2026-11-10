import React from 'react';
import './primitives.css';

export default function SjButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon = null,
  iconPosition = 'left',
  ...rest
}) {
  const variantClass = {
    primary: 'sj-btn-primary',
    outline: 'sj-btn-outline',
    ghost: 'sj-btn-ghost',
    link: 'sj-btn-link',
    danger: 'sj-btn-danger',
    applied: 'sj-btn-applied',
  }[variant] || 'sj-btn-primary';

  const sizeClass = {
    sm: 'sj-btn-sm',
    md: 'sj-btn-md',
    lg: 'sj-btn-lg',
  }[size] || 'sj-btn-md';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`sj-btn ${variantClass} ${sizeClass} ${className}`.trim()}
      {...rest}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
    </button>
  );
}

