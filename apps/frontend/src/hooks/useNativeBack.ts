/**
 * Hook to handle the Android hardware back button.
 *
 * - If a dialog/modal is open, closes it.
 * - If not on the home page, navigates back.
 * - If on the home page, minimizes the app (default Android behaviour).
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { isNative } from '@/lib/native';

export function useNativeBack(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNative()) return;

    const handler = CapApp.addListener('backButton', ({ canGoBack }) => {
      // Check if a dialog/modal is open
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        // Try to close it via the close button or Escape
        const closeBtn = dialog.querySelector<HTMLButtonElement>(
          '[aria-label*="close" i], [aria-label*="cerrar" i], [data-dialog-close]',
        );
        if (closeBtn) {
          closeBtn.click();
          return;
        }
      }

      // If not on the root page, go back
      if (location.pathname !== '/' && location.pathname !== '/login') {
        navigate(-1);
        return;
      }

      // On root page — minimize the app
      if (canGoBack) {
        CapApp.minimizeApp();
      }
    });

    return () => {
      handler.then((l) => l.remove());
    };
  }, [location.pathname, navigate]);
}
