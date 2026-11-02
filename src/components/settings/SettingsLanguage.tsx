'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/constants';

const SettingsLanguage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.resolvedLanguage)?.label ||
    SUPPORTED_LANGUAGES[0]?.label ||
    'English';

  return (
    <div className="bg-surface/30 p-5 sm:p-6 rounded-3xl border border-surface transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="language-accordion-content"
        className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20 shrink-0">
            <Languages className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-text">
              {t('settings.language.title', 'Idioma')}
            </h2>
            <p className="text-xs text-soft truncate">
              {t('settings.language.subtitle', 'Escolha o idioma de exibição do aplicativo')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/20 font-semibold">
            {currentLanguageLabel}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-soft transition-transform duration-200 group-hover:text-text ${
              isOpen ? 'rotate-180 text-accent' : ''
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="language-accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-surface/50 mt-5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    i18n.resolvedLanguage === lang.code
                      ? 'bg-accent text-warm border-accent shadow-md'
                      : 'bg-surface hover:bg-surface/80 border-transparent text-text hover:shadow-sm'
                  }`}
                >
                  <div className="font-bold">{lang.label}</div>
                  {i18n.resolvedLanguage === lang.code && (
                    <div className="text-xs opacity-80 mt-1">
                      {t('settings.language.current')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsLanguage;
