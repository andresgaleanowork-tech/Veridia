import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, description, checked, onChange, disabled = false, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out',
          checked ? 'bg-primary' : 'bg-surface-3',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        <span
          className={[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-6' : 'translate-x-1',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {(label || description) && (
          <div className="ml-3">
            {label && <span className="text-sm font-medium text-text">{label}</span>}
            {description && <p className="text-xs text-text-3">{description}</p>}
          </div>
        )}
      </button>
    );
  }
);

Switch.displayName = 'Switch';
