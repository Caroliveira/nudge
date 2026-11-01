import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetPasswordPage from '@/views/ResetPasswordPage';

export const metadata: Metadata = {
  title: 'Redefinir senha - Nudge',
  description: 'Crie uma nova senha para sua conta no Nudge.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-warm" />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
