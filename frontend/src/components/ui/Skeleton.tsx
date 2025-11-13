/**
 * Skeleton Component
 * Loading placeholder component with pulse animation
 */
import React from 'react';

type SkeletonProps = {
  className?: string;
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  animated?: boolean;
  'aria-hidden'?: boolean;
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width = '100%',
  height = '1rem',
  radius = '0.75rem',
  animated = true,
  'aria-hidden': ariaHidden = true,
}) => {
  const style: React.CSSProperties = {
    width,
    height,
    borderRadius: radius,
  };

  const classes = [
    'block',
    'bg-slate-200',
    'dark:bg-slate-700',
    animated ? 'animate-pulse' : '',
    'relative',
    'overflow-hidden',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={style}
      aria-hidden={ariaHidden}
    >
      <span className="sr-only">Loading…</span>
    </span>
  );
};

export default Skeleton;

