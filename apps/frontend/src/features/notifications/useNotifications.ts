import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const { data } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data?.count !== undefined) {
      setUnreadCount(data.count);
    }
  }, [data]);

  return { unreadCount };
}
