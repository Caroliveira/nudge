'use client';

import React, { useEffect } from 'react';
import '@/i18n';
import { useStore } from '@/store/useStore';
import AppLayout from '@/components/AppLayout';

export function Providers({ children }: { children: React.ReactNode }) {
  const refreshRecurringTasks = useStore((state) => state.refreshRecurringTasks);

  useEffect(() => {
    refreshRecurringTasks();
  }, [refreshRecurringTasks]);

  return <AppLayout>{children}</AppLayout>;
}
