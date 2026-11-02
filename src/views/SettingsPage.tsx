'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import SettingsPlaces from '@/components/settings/SettingsPlaces';
import SettingsCsv from '@/components/settings/SettingsCsv';
import SettingsLanguage from '@/components/settings/SettingsLanguage';
import SettingsAccount from '@/components/settings/SettingsAccount';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <section className="w-full max-w-2xl mx-auto p-4 sm:p-6 fade-in flex flex-col min-h-[85dvh]">
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-3xl serif text-text">{t('settings.title')}</h1>
        <nav aria-label="Settings Back Navigation">
          <button
            onClick={() => router.back()}
            className="text-soft hover:text-accent transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="underline underline-offset-4">{t('settings.back')}</span>
          </button>
        </nav>
      </header>

      <div className="space-y-6">
        <SettingsPlaces />
        <SettingsCsv />
        <SettingsLanguage />
        <SettingsAccount />
      </div>
    </section>
  );
};

export default SettingsPage;
