import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, children }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-white/10">
      <div className="flex-1 min-w-0">
        {title && <h3 className="text-base font-semibold text-text truncate">{title}</h3>}
        {description && <p className="mt-0.5 text-sm text-text-3">{description}</p>}
        {children}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-white/10 ${className}`}>
      {children}
    </div>
  );
}
