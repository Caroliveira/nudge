'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Task } from '@/types';
import { HouseholdProfile } from '@/lib/db';
import { getQueryClient } from '@/lib/queryClient';
import { TASK_QUERY_KEYS } from '@/hooks/useTasksQuery';

interface StoreInitializerProps {
  tasks: Task[];
  profile?: HouseholdProfile;
  userEmail?: string;
  userName?: string;
}

export function StoreInitializer({ tasks, profile, userEmail, userName }: StoreInitializerProps) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useStore.getState().initializeFromSSR(tasks, profile, userEmail, userName);
    if (typeof window !== 'undefined') {
      const queryClient = getQueryClient();
      queryClient.setQueryData(TASK_QUERY_KEYS.lists(), tasks);
    }
    initialized.current = true;
  }

  useEffect(() => {
    useStore.getState().initializeFromSSR(tasks, profile, userEmail, userName);
    const queryClient = getQueryClient();
    queryClient.setQueryData(TASK_QUERY_KEYS.lists(), tasks);
  }, [tasks, profile, userEmail, userName]);

  return null;
}
