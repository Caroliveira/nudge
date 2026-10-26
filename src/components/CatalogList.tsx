'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isToday } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X } from 'lucide-react';
import { Task, EffortLevel, RecurrenceUnit } from '../types';
import { CatalogView, useCatalogFilter } from '../hooks/useCatalogFilter';
import TaskCatalogItem from './TaskCatalogItem';
import CatalogEmptyState from './CatalogEmptyState';

interface CatalogListProps {
  tasks: Task[];
  view: CatalogView;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const recurrenceOptions: RecurrenceUnit[] = ['none', 'days', 'weeks', 'months', 'years'];
type StatusFilterValue = 'ALL' | 'AVAILABLE' | 'DONE' | 'TODAY';
type EffortFilterValue = 'ALL' | EffortLevel;
type RecurrenceFilterValue = 'ALL' | RecurrenceUnit;
const removeAccents = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const CatalogList: React.FC<CatalogListProps> = ({ tasks, view, onToggle, onDelete, onEdit }) => {
  const { t } = useTranslation();
  const { sortedTasks } = useCatalogFilter(tasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
  const [effortFilter, setEffortFilter] = useState<EffortFilterValue>('ALL');
  const [recurrenceFilter, setRecurrenceFilter] = useState<RecurrenceFilterValue>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedFilterCount =
    Number(statusFilter !== 'ALL') +
    Number(effortFilter !== 'ALL') +
    Number(recurrenceFilter !== 'ALL');
  const clearAllFilters = () => {
    setStatusFilter('ALL');
    setEffortFilter('ALL');
    setRecurrenceFilter('ALL');
  };

  useEffect(() => {
    if (!isFilterOpen) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!filterContainerRef.current?.contains(target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [isFilterOpen]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = removeAccents(searchQuery);

    return sortedTasks.filter((task) => {
      const matchesSearch = removeAccents(task.title).includes(normalizedQuery);
      const taskRecurrence = task.recurrenceUnit ?? 'none';

      let matchesStatus = true;
      if (statusFilter === 'TODAY') {
        matchesStatus = !!(
          task.isCompleted &&
          task.lastCompletedAt &&
          isToday(task.lastCompletedAt)
        );
      } else if (statusFilter === 'AVAILABLE') {
        matchesStatus = !task.isCompleted;
      } else if (statusFilter === 'DONE') {
        matchesStatus = !!task.isCompleted;
      }

      const matchesEffort = effortFilter === 'ALL' || task.level === effortFilter;
      const matchesRecurrence = recurrenceFilter === 'ALL' || taskRecurrence === recurrenceFilter;

      return matchesSearch && matchesStatus && matchesEffort && matchesRecurrence;
    });
  }, [sortedTasks, searchQuery, statusFilter, effortFilter, recurrenceFilter]);

  if (tasks.length === 0) {
    return <CatalogEmptyState view={view} />;
  }

  return (
    <div className="w-full flex flex-col gap-2 mt-4">
      <div className="flex flex-row gap-2 items-center mb-2">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-soft opacity-50" />
          </div>
          <input
            type="text"
            placeholder={t('catalog.search', 'Search tasks...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 bg-surface text-text placeholder:text-soft rounded-lg border border-soft/30 focus:outline-none focus:border-accent transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label={t('catalog.clearSearch', 'Clear search')}
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-2 my-auto h-7 w-7 rounded-md text-soft hover:text-accent transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div ref={filterContainerRef} className="relative shrink-0">
          <button
            type="button"
            aria-label={t('catalog.openFilters', 'Open filters')}
            onClick={() => setIsFilterOpen((open) => !open)}
            className="relative w-10 h-10 bg-surface border border-soft/30 rounded-lg flex items-center justify-center hover:border-accent transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4 text-soft" />
            {selectedFilterCount > 0 && (
              <span
                data-testid="selected-filter-count"
                className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-accent text-white text-[10px] leading-4 font-semibold"
              >
                {selectedFilterCount}
              </span>
            )}
          </button>
          {isFilterOpen && (
            <div className="absolute right-0 top-12 z-20 w-56 p-3 rounded-lg border border-soft/30 bg-surface shadow-lg flex flex-col gap-2">
              <select
                aria-label={t('catalog.filterStatus')}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
                className="w-full px-3 py-2 bg-warm text-text rounded-md border border-soft/30 focus:outline-none focus:border-accent appearance-none cursor-pointer text-sm"
              >
                <option value="ALL">{t('catalog.filterAllStatus', 'All status')}</option>
                <option value="AVAILABLE">{t('catalog.filterAvailable', 'Available')}</option>
                <option value="DONE">{t('catalog.filterDone', 'Done')}</option>
                <option value="TODAY">{t('catalog.filterToday', 'Made Today')}</option>
              </select>
              <select
                aria-label={t('catalog.filterEffort')}
                value={effortFilter}
                onChange={(e) => setEffortFilter(e.target.value as EffortFilterValue)}
                className="w-full px-3 py-2 bg-warm text-text rounded-md border border-soft/30 focus:outline-none focus:border-accent appearance-none cursor-pointer text-sm"
              >
                <option value="ALL">{t('catalog.filterAllEffort', 'All effort')}</option>
                {Object.values(EffortLevel).map((level) => (
                  <option key={level} value={level}>
                    {t(`effort.short.${level.toLowerCase()}`, level)}
                  </option>
                ))}
              </select>
              <select
                aria-label={t('catalog.filterRecurrence')}
                value={recurrenceFilter}
                onChange={(e) => setRecurrenceFilter(e.target.value as RecurrenceFilterValue)}
                className="w-full px-3 py-2 bg-warm text-text rounded-md border border-soft/30 focus:outline-none focus:border-accent appearance-none cursor-pointer text-sm"
              >
                <option value="ALL">{t('catalog.filterAllRecurrence', 'All recurrence')}</option>
                {recurrenceOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {t(`recurrence.${unit}`, unit)}
                  </option>
                ))}
              </select>
              {selectedFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full px-3 py-2 text-sm text-soft hover:text-accent border border-soft/30 rounded-md hover:border-accent transition-colors"
                >
                  {t('catalog.clearAllFilters', 'Clear all filters')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ul className="space-y-3 pb-8 relative mt-2">
        <AnimatePresence initial={false} mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.li
              key="empty-search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="text-center py-8 text-soft italic list-none"
            >
              {t('catalog.emptySearch', 'No tasks found matching your filters.')}
            </motion.li>
          ) : (
            filteredTasks.map((task) => (
              <motion.li
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, height: 0, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <TaskCatalogItem
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={() => onEdit(task)}
                />
              </motion.li>
            ))
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default CatalogList;
