import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  searchable?: boolean;
  nativeOnMobile?: boolean;
  className?: string;
}

export function Select({
  label,
  error,
  placeholder = 'Seleccionar...',
  options,
  value,
  onValueChange,
  searchable = false,
  nativeOnMobile = true,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // On touch devices, prefer a native <select> to avoid overlay/keyboard issues.
  const isTouch =
    typeof window !== 'undefined' &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

  const useNative = nativeOnMobile && isTouch;

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (useNative) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDropdown();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeDropdown, useNative]);

  useEffect(() => {
    if (useNative) return;
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable, useNative]);

  useEffect(() => {
    if (useNative) return;
    if (activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex] as HTMLElement | undefined;
      activeElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, useNative]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (useNative) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(options.findIndex((o) => o.value === value));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1;
          return next >= filteredOptions.length ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? filteredOptions.length - 1 : next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          const opt = filteredOptions[activeIndex]!;
          if (!opt.disabled) {
            onValueChange?.(opt.value);
            closeDropdown();
          }
        }
        break;
      case 'Tab':
        closeDropdown();
        break;
    }
  };

  const inputId = useId();
  const listId = `${inputId}-list`;
  const errorId = `${inputId}-error`;

  if (useNative) {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-text-2 mb-1.5">{label}</label>
        )}
        <select
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={[
            'w-full bg-surface border rounded-xl px-3 py-2.5 text-text',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-danger focus:ring-danger/40 focus:border-danger' : 'border-border',
          ].join(' ')}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-2 mb-1.5">{label}</label>
      )}
      <div ref={containerRef} className="relative">
        <button
          id={inputId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          className={[
            'w-full bg-surface border rounded-xl px-3 py-2.5 text-left text-text',
            'transition-colors duration-200 flex items-center justify-between gap-2',
            'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-danger focus:ring-danger/40 focus:border-danger' : 'border-border',
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
        >
          <span className={selectedOption ? 'text-text' : 'text-text-3'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className="shrink-0 text-text-3 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : undefined }} />
        </button>

        {isOpen && (
          <div
            className="absolute z-40 mt-2 w-full bg-surface border border-border rounded-xl shadow-lg overflow-hidden"
            role="listbox"
            id={listId}
          >
            {searchable && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <Search size={14} className="shrink-0 text-text-3" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar..."
                  className="w-full bg-transparent text-sm text-text placeholder:text-text-3 focus:outline-none"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="p-1 rounded-lg hover:bg-white/10 text-text-3 hover:text-text transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
            <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-text-3">Sin resultados</p>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === value}
                    aria-disabled={opt.disabled}
                    className={[
                      'px-3 py-2 text-sm cursor-pointer transition-colors duration-150 flex items-center justify-between',
                      opt.disabled
                        ? 'text-text-3 opacity-50 cursor-not-allowed'
                        : idx === activeIndex
                          ? 'bg-surface-3 text-text'
                          : 'text-text hover:bg-surface-3',
                      opt.value === value ? 'text-primary font-medium' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      if (!opt.disabled) {
                        onValueChange?.(opt.value);
                        closeDropdown();
                      }
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    {opt.label}
                    {opt.value === value && <span className="ml-2">✓</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
