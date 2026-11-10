import React from 'react';
import './primitives.css';

export default function SjPill({
  children,
  variant = 'default',
  className = '',
  icon = null,
  onClick,
  ...rest
}) {
  const variantClass = {
    default: '',
    accent: 'sj-pill-accent',
    highlight: 'sj-pill-highlight',
    ok: 'sj-badge-ok',
  }[variant] || '';

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={`sj-pill ${variantClass} ${className}`.trim()}
      {...rest}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </Component>
  );
}

