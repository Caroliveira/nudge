'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { APP_ROUTES } from '../constants';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isSettingsPage = pathname === APP_ROUTES.SETTINGS;

  return (
    <main className="min-h-dvh w-full flex flex-col items-center justify-center bg-warm px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] select-none overflow-x-hidden relative">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-surface rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-surface rounded-full blur-3xl" />
      </div>

      {!isSettingsPage && (
        <Link
          href={APP_ROUTES.SETTINGS}
          className="absolute top-6 right-6 p-2 text-soft hover:text-accent transition-colors z-50 rounded-full hover:bg-surface/50"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </Link>
      )}

      <div className="z-10 w-full max-w-4xl flex items-center justify-center">{children}</div>
    </main>
  );
};

export default AppLayout;
