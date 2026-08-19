import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  id: string;
  header: ReactNode;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(defaultOpen)
  );

  const toggleItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.disabled) return;

    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  const isOpen = (id: string) => openItems.has(id);

  return (
    <div className={`space-y-2 ${className}`} role="region" aria-label="Accordion">
      {items.map((item) => {
        const opened = isOpen(item.id);
        return (
          <div
            key={item.id}
            className="border border-border rounded-xl overflow-hidden bg-surface"
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              disabled={item.disabled}
              aria-expanded={opened}
              aria-controls={`${item.id}-content`}
              id={`${item.id}-trigger`}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 text-left',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset',
                item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/3',
              ].join(' ')}
            >
              {item.icon && <span className="shrink-0 text-text-3">{item.icon}</span>}
              <span className="flex-1 text-sm font-medium text-text">{item.header}</span>
              <ChevronDown
                size={18}
                className={[
                  'shrink-0 text-text-3 transition-transform duration-200',
                  opened ? 'rotate-180' : 'rotate-0',
                ].join(' ')}
                aria-hidden="true"
              />
            </button>
            <div
              id={`${item.id}-content`}
              role="region"
              aria-labelledby={`${item.id}-trigger`}
              className="overflow-hidden transition-all duration-200 ease-out"
              style={{
                maxHeight: opened ? '500px' : '0',
                opacity: opened ? 1 : 0,
                padding: opened ? '0 4px 4px' : '0 4px',
              }}
            >
              <div className="px-4 pb-4 text-sm text-text-2 animate-fade-in">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}