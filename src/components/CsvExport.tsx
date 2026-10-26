'use client';

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Papa from 'papaparse';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { IMPORT_CONFIG } from '../constants';

const CsvExport: React.FC = () => {
  const { t } = useTranslation();
  const { tasks } = useStore();
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!exportStatus) return;
    const timer = setTimeout(() => {
      setExportStatus(null);
    }, IMPORT_CONFIG.STATUS_MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [exportStatus]);

  const handleExportCSV = () => {
    try {
      if (tasks.length === 0) {
        setExportStatus(t('export.failed'));
        return;
      }

      const exportData = tasks.map((task) => ({
        id: task.id,
        title: task.title,
        effort: task.level.toLowerCase(),
        interval: task.recurrenceInterval || 1,
        unit: task.recurrenceUnit || 'none',
        isCompleted: task.isCompleted ?? false,
        lastCompletedAt: task.lastCompletedAt ?? '',
        nextAvailableAt: task.nextAvailableAt ?? '',
      }));

      const csvContent = Papa.unparse(exportData);
      const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'nudge_tasks_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus(t('export.success', { count: tasks.length }));
    } catch {
      setExportStatus(t('export.failed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex-1 py-3 px-4 bg-surface/40 border border-surface rounded-xl text-soft hover:bg-surface hover:text-text transition-all text-sm flex items-center justify-center gap-2"
          aria-label={t('export.ariaLabel')}
        >
          <Download className="w-4 h-4" />
          {t('export.button')}
        </button>
      </div>
      {exportStatus && (
        <p className="text-center text-accent text-sm font-medium animate-pulse">{exportStatus}</p>
      )}
    </div>
  );
};

export default CsvExport;
