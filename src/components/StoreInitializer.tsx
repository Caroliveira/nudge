'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Task } from '@/types';
import { HouseholdProfile } from '@/lib/db';

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
    initialized.current = true;
  }

  useEffect(() => {
    useStore.getState().initializeFromSSR(tasks, profile, userEmail, userName);
  }, [tasks, profile, userEmail, userName]);

  return null;
}
