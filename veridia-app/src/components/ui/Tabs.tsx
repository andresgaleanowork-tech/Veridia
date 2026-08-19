import { useState, type ReactNode } from 'react';

type TabsVariant = 'default' | 'pills' | 'underline';

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  variant?: TabsVariant;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs({
  items,
  variant = 'default',
  defaultValue,
  onChange,
  className = '',
}: TabsProps) {
  const [activeValue, setActiveValue] = useState(defaultValue || items[0]?.id || '');
  const tabsId = `tabs-${Math.random().toString(36).slice(2, 9)}`;

  const variantClasses: Record<TabsVariant, { container: string; tab: string; indicator: string }> = {
    default: {
      container: 'border-b border-border',
      tab: 'relative',
      indicator: 'absolute bottom-0 h-0.5 bg-primary transition-all duration-200 ease-out',
    },
    pills: {
      container: 'gap-1',
      tab: '',
      indicator: '',
    },
    underline: {
      container: '',
      tab: 'relative',
      indicator: 'absolute bottom-0 h-0.5 bg-primary transition-all duration-200 ease-out',
    },
  };

  const { container: containerClass, tab: tabClass, indicator: indicatorClass } = variantClasses[variant];

  const handleTabClick = (tabId: string) => {
    const tab = items.find((t) => t.id === tabId);
    if (!tab?.disabled) {
      setActiveValue(tabId);
      onChange?.(tabId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    const enabledItems = items.filter((t) => !t.disabled);
    const currentIndex = enabledItems.findIndex((t) => t.id === tabId);
    
    let nextIndex = currentIndex;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % enabledItems.length;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = enabledItems.length - 1;
        break;
      default:
        return;
    }
    
    const nextTab = enabledItems[nextIndex];
    if (nextTab) {
      handleTabClick(nextTab.id);
    }
  };

  return (
    <div className={`w-full ${className}`} role="tablist" aria-label={tabsId}>
      <div className={`flex ${containerClass}`}>
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeValue === item.id}
            aria-controls={`${tabsId}-panel-${item.id}`}
            id={`${tabsId}-tab-${item.id}`}
            tabIndex={activeValue === item.id ? 0 : -1}
            disabled={item.disabled}
            onClick={() => handleTabClick(item.id)}
            onKeyDown={(e) => handleKeyDown(e, item.id)}
            className={[
              tabClass,
              'px-4 py-2.5 text-sm font-medium transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-surface',
              item.disabled
                ? 'text-text-3 cursor-not-allowed'
                : activeValue === item.id
                ? variant === 'pills'
                  ? 'bg-primary/10 text-primary'
                  : 'text-primary'
                : 'text-text-2 hover:text-text hover:bg-white/5',
            ].filter(Boolean).join(' ')}
          >
            {item.label}
          </button>
        ))}
        
        {(variant !== 'pills' && activeValue) && (
          <div
            className={indicatorClass}
            style={{
              width: undefined, // Would need ref to measure
            }}
          />
        )}
      </div>

      <div className="mt-4">
        {items.map((item) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`${tabsId}-panel-${item.id}`}
            aria-labelledby={`${tabsId}-tab-${item.id}`}
            hidden={activeValue !== item.id}
            className="animate-fade-in"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}