'use client';

import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import '@/i18n';
import { getQueryClient } from '@/lib/queryClient';
import { useStore } from '@/store/useStore';
import AppLayout from '@/components/AppLayout';

export function Providers({ children }: { children: React.ReactNode }) {
  // Use useState to ensure client is preserved across re-renders in client component tree
  const [queryClient] = useState(() => getQueryClient());
  const refreshRecurringTasks = useStore((state) => state.refreshRecurringTasks);

  useEffect(() => {
    refreshRecurringTasks();
  }, [refreshRecurringTasks]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>{children}</AppLayout>
    </QueryClientProvider>
  );
}
