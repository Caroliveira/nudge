'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useTranslation } from 'react-i18next';
import { CsvTaskRow } from '../types';
import { useStore } from '../store/useStore';
import { IMPORT_CONFIG } from '../constants';
import { validateHeaders, processImportedTasks } from '../utils/csvUtils';

const CsvImport: React.FC = () => {
  const { t } = useTranslation();
  const { tasks, addTask } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!importStatus) return;
    const timer = setTimeout(() => {
      setImportStatus(null);
    }, IMPORT_CONFIG.STATUS_MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [importStatus]);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > IMPORT_CONFIG.MAX_FILE_SIZE_BYTES) {
      setImportStatus(t('import.tooLarge'));
      return;
    }

    Papa.parse<CsvTaskRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) =>
        h
          .replace(/^\uFEFF/, '')
          .trim()
          .toLowerCase(),
      complete: (results) => {
        try {
          const { data, meta } = results;

          if (results.errors && results.errors.length > 0) {
            setImportStatus(t('import.parseError', { message: results.errors[0].message }));
            return;
          }

          const headers = meta.fields || [];
          if (!validateHeaders(headers)) {
            setImportStatus(t('import.invalidFormat'));
            return;
          }

          const { tasksToAdd, skippedCount, count } = processImportedTasks(data, tasks);

          tasksToAdd.forEach((task) => addTask(task));

          const skippedMsg =
            skippedCount > 0 ? t('import.duplicatesSkipped', { count: skippedCount }) : '';
          setImportStatus(t('import.success', { count, skippedMsg }));
        } catch {
          setImportStatus(t('import.failed'));
        }
      },
      error: (error) => {
        setImportStatus(t('import.failedMessage', { message: error.message }));
      },
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const csvContent = `data:text/csv;charset=utf-8,title,effort,interval,unit\n${t('import.example1')},low,1,days\n${t('import.example2')},high,1,weeks`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'nudge_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-3 px-4 bg-surface/40 border border-surface rounded-xl text-soft hover:bg-surface hover:text-text transition-all text-sm flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {t('import.button')}
        </button>
        <button
          type="button"
          onClick={downloadTemplate}
          className="py-3 px-4 text-soft hover:text-accent transition-all text-xs underline underline-offset-4"
        >
          {t('import.template')}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportCSV}
          accept=".csv"
          className="hidden"
          aria-label={t('import.ariaLabel')}
        />
      </div>
      {importStatus && (
        <p className="text-center text-accent text-sm font-medium animate-pulse">{importStatus}</p>
      )}
    </div>
  );
};

export default CsvImport;
