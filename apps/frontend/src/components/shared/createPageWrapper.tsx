import { type ComponentType } from 'react';
import { RouteWrapper } from '@/components/shared/RouteWrapper';
import type { LucideIcon } from 'lucide-react';

export function createPageWrapper(Page: ComponentType, icon: LucideIcon, title: string, description: string, reloadPath: string) {
  return function PageWrapper() {
    return (
      <RouteWrapper icon={icon} title={title} description={description} reloadPath={reloadPath}>
        <Page />
      </RouteWrapper>
    );
  };
}
