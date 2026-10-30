import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginPage from '@/views/LoginPage';

export const metadata: Metadata = {
  title: 'Criar conta - Nudge',
  description: 'Crie seu espaço de tarefas com calma e intencionalidade no Nudge.',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-warm" />}>
      <LoginPage initialMode="register" />
    </Suspense>
  );
}
