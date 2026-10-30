import { Suspense } from 'react';
import CatalogPage from '@/views/CatalogPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-4">Loading...</div>}>
      <CatalogPage />
    </Suspense>
  );
}
