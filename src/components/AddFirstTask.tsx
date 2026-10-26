'use client';

import { APP_ROUTES } from '@/constants';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

const AddFirstTask: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center space-y-10 fade-in py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl text-text font-light serif">
          {t('home.firstTask.title')}
        </h1>
        <p className="text-lg text-soft italic max-w-md mx-auto">{t('home.firstTask.subtitle')}</p>
      </div>
      <button
        type="button"
        onClick={() => router.push(APP_ROUTES.CATALOG)}
        className="group relative py-4 px-8 rounded-full bg-accent text-white transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-3 font-medium text-lg cursor-pointer"
      >
        <span className="text-2xl">+</span>
        {t('home.firstTask.cta')}
        <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500"></div>
      </button>
    </div>
  );
};

export default AddFirstTask;
