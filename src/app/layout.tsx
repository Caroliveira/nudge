import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { StoreInitializer } from '@/components/StoreInitializer';
import { getSession } from '@/lib/session';
import { getHouseholdData } from '@/lib/db';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nudge - Minimalist Action',
  description: 'A gentle task management application designed for simplicity and focus.',
  openGraph: {
    type: 'website',
    url: 'https://nudge.lina-oliveira.com/',
    title: 'Nudge - Minimalist Action',
    description: 'A gentle task management application designed for simplicity and focus.',
    siteName: 'Nudge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nudge - Minimalist Action',
    description: 'A gentle task management application designed for simplicity and focus.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const householdId = session?.householdId || 'default-household';
  const { profile, tasks } = await getHouseholdData(householdId);

  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="bg-warm text-text font-sans antialiased min-h-dvh">
        <StoreInitializer
          tasks={tasks}
          profile={profile}
          userEmail={session?.email}
          userName={session?.name}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
