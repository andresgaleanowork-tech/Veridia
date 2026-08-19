interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'table-row' | 'list';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'rect', width, height }: SkeletonProps) {
  const base = 'animate-pulse bg-surface-2';

  const variantClasses: Record<string, string> = {
    text: 'rounded h-4',
    rect: 'rounded-xl',
    circle: 'rounded-full',
    card: 'rounded-2xl p-6 space-y-4',
    'table-row': 'px-3 py-3',
    list: 'flex items-center gap-3 px-3 py-3',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (variant === 'text') {
    style.height = typeof height === 'number' ? `${height}px` : height ?? '1rem';
  } else if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  if (variant === 'card') {
    return (
      <div className={`${base} ${variantClasses[variant]} ${className}`} style={style} aria-hidden="true">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" width={48} height={48} />
          <div className="space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="30%" />
          </div>
        </div>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
        <div className="flex gap-2">
          <Skeleton variant="rect" width={80} height={32} />
          <Skeleton variant="rect" width={80} height={32} />
        </div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <tr className={`${base} ${variantClasses[variant]} ${className}`} style={style} aria-hidden="true">
        <td><Skeleton variant="text" width="80%" /></td>
        <td><Skeleton variant="text" width="60%" /></td>
        <td><Skeleton variant="text" width="50%" /></td>
        <td><Skeleton variant="text" width="40%" /></td>
        <td><Skeleton variant="rect" width={80} height={28} /></td>
      </tr>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`${base} ${variantClasses[variant]} ${className}`} style={style} aria-hidden="true">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="30%" />
        </div>
        <Skeleton variant="rect" width={80} height={28} />
      </div>
    );
  }

  return (
    <span
      className={`${base} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}