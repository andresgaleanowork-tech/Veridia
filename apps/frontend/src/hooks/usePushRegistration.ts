import { useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { captureError } from '@/lib/errorReporting';

export function usePushRegistration() {
  const register = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });

      await api.post('/portal/push/subscribe', {
        fcm_token: JSON.stringify(subscription),
        platform: 'web',
      });
    } catch (error) {
      captureError(error, { component: 'usePushRegistration', operation: 'pushSubscribe' });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('veridia_patient_token');
    if (token) register();
  }, [register]);
}
