import { type TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      resize = 'vertical',
      showCount = false,
      maxLength,
      className = '',
      id,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const countId = `${inputId}-count`;

    const currentLength = typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0;
    const isOverLimit = maxLength !== undefined && currentLength > maxLength;

    const resizeClasses: Record<string, string> = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-2 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            className={[
              'w-full bg-surface border rounded-xl px-3 py-2.5 text-text placeholder:text-text-3',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              resizeClasses[resize],
              error ? 'border-danger focus:ring-danger/40 focus:border-danger' : 'border-border',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
        </div>
        {(error || helperText || showCount) && (
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p
              id={error ? errorId : helperId}
              className={`text-xs ${error ? 'text-danger' : 'text-text-3'}`}
            >
              {error || helperText}
            </p>
            {showCount && (
              <p
                id={countId}
                className={`text-xs tabular-nums ${isOverLimit ? 'text-danger' : 'text-text-3'}`}
                aria-live="polite"
              >
                {currentLength}{maxLength !== undefined && `/${maxLength}`}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
