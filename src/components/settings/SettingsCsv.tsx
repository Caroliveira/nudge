'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CsvExport from '@/components/CsvExport';
import CsvImport from '@/components/CsvImport';

const SettingsCsv: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface/30 p-5 sm:p-6 rounded-3xl border border-surface transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="csv-accordion-content"
        className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20 shrink-0">
            <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-text">
              {t('settings.csv.title', 'Backup & CSV')}
            </h2>
            <p className="text-xs text-soft truncate">
              {t('settings.csv.subtitle', 'Importe ou exporte suas tarefas em formato CSV')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface text-soft border border-surface">
            {t('settings.csv.badge', 'Importar / Exportar')}
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
            id="csv-accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-5 border-t border-surface/50 mt-5">
              <CsvImport />
              <CsvExport />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsCsv;
