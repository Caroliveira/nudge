import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginPage from '@/views/LoginPage';

export const metadata: Metadata = {
  title: 'Entrar - Nudge',
  description: 'Acesse seu espaço de tarefas no Nudge com calma e foco.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-warm" />}>
      <LoginPage />
    </Suspense>
  );
}
