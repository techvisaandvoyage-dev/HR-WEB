import React from 'react';
import './primitives.css';

export default function SjAvatar({
  src = '',
  name = '',
  size = 'md',
  isCircle = false,
  className = '',
  alt = '',
  ...rest
}) {
  const sizeClass = {
    sm: 'sj-avatar-sm',
    md: 'sj-avatar-md',
    lg: 'sj-avatar-lg',
  }[size] || 'sj-avatar-md';

  const circleClass = isCircle ? 'sj-avatar-circle' : '';

  const initial = name ? String(name).trim().charAt(0).toUpperCase() : '?';

  return (
    <div
      className={`sj-avatar ${sizeClass} ${circleClass} ${className}`.trim()}
      {...rest}
    >
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} loading="lazy" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

