'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Task } from '@/types';
import { HouseholdProfile } from '@/lib/db';

interface StoreInitializerProps {
  tasks: Task[];
  profile?: HouseholdProfile;
  userEmail?: string;
}

export function StoreInitializer({ tasks, profile, userEmail }: StoreInitializerProps) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useStore.getState().initializeFromSSR(tasks, profile, userEmail);
    initialized.current = true;
  }

  useEffect(() => {
    useStore.getState().initializeFromSSR(tasks, profile, userEmail);
  }, [tasks, profile, userEmail]);

  return null;
}
