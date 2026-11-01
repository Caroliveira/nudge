'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Task, EffortLevel, RecurrenceUnit } from '../types';
import { useTaskForm } from '../hooks/useTaskForm';
import { useStore } from '../store/useStore';

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id'>) => void;
  onCancel: () => void;
  initialValues?: Partial<Task>;
}

const shakeAnimation = {
  x: [0, -4, 4, -4, 4, 0],
  transition: { duration: 0.4 },
};

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, initialValues }) => {
  const { t } = useTranslation();
  const places = useStore((state) => state.places);
  const addPlace = useStore((state) => state.addPlace);

  const {
    title,
    updateTitle,
    level,
    updateLevel,
    place,
    updatePlace,
    recurrenceInterval,
    updateRecurrenceInterval,
    recurrenceUnit,
    updateRecurrenceUnit,
    errors,
    isSuccess,
    handleSubmit,
  } = useTaskForm({ onSubmit, initialValues });

  // Place search and autocomplete state
  const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPlaceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPlaces = places.filter((p) => p.toLowerCase().includes(place.trim().toLowerCase()));

  const isExactMatch = places.some((p) => p.toLowerCase() === place.trim().toLowerCase());

  const handleSelectPlace = (selectedPlace: string) => {
    updatePlace(selectedPlace);
    setIsPlaceDropdownOpen(false);
  };

  const handleCreatePlace = async (newPlaceName: string) => {
    const trimmed = newPlaceName.trim();
    if (!trimmed) return;
    await addPlace(trimmed);
    updatePlace(trimmed);
    setIsPlaceDropdownOpen(false);
  };

  if (isSuccess) {
    return (
      <div className="bg-surface p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px] fade-in border border-soft/20 shadow-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-success text-6xl mb-4"
        >
          <Check className="w-16 h-16" />
        </motion.div>
        <h3 className="text-2xl font-bold text-text">
          {initialValues ? t('form.successUpdate') : t('form.successSave')}
        </h3>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface p-6 rounded-2xl space-y-6 fade-in border border-soft/20 shadow-sm"
      aria-label={initialValues ? t('form.update') : t('catalog.addPersonalTask')}
    >
      {/* Title */}
      <div>
        <label
          htmlFor="task-title"
          className="block text-xs uppercase tracking-widest text-soft mb-2 font-bold"
        >
          {t('form.title')}
        </label>
        <motion.input
          id="task-title"
          autoFocus
          animate={errors.title ? shakeAnimation : {}}
          className={`w-full bg-warm border-none rounded-lg p-3 text-text focus:ring-2 outline-none text-lg ${
            errors.title ? 'ring-2 ring-red-700' : 'focus:ring-accent'
          }`}
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder={t('form.placeholder')}
          aria-invalid={!!errors.title}
        />
      </div>

      {/* Place / Category (Searchable & Creatable) */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="task-place"
            className="block text-xs uppercase tracking-widest text-soft font-bold"
          >
            {t('form.place', 'Lugar da casa')} <span className="text-red-500">*</span>
          </label>
          {place && (
            <span className="text-xs text-soft">
              {t('form.selectedPlace', 'Selecionado')}:{' '}
              <strong className="text-accent">{place}</strong>
            </span>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
            <MapPin className="w-4 h-4" />
          </div>
          <motion.input
            id="task-place"
            type="text"
            animate={errors.place ? shakeAnimation : {}}
            className={`w-full pl-10 pr-10 bg-warm border-none rounded-lg p-3 text-text focus:ring-2 outline-none text-base ${
              errors.place ? 'ring-2 ring-red-700' : 'focus:ring-accent'
            }`}
            value={place}
            onFocus={() => setIsPlaceDropdownOpen(true)}
            onChange={(e) => {
              updatePlace(e.target.value);
              setIsPlaceDropdownOpen(true);
            }}
            placeholder={t(
              'form.placePlaceholder',
              'Digite ou escolha um lugar (ex: Cozinha, Quarto...)',
            )}
            aria-invalid={!!errors.place}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setIsPlaceDropdownOpen(!isPlaceDropdownOpen)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-soft hover:text-text transition-colors"
            aria-label="Abrir opções de lugares"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isPlaceDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {isPlaceDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 mt-1.5 w-full bg-surface border border-surface rounded-xl shadow-lg max-h-56 overflow-y-auto py-1 divide-y divide-surface/40 backdrop-blur-md"
            >
              {/* Option to create new place if not an exact match */}
              {place.trim() && !isExactMatch && (
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => handleCreatePlace(place.trim())}
                    className="w-full text-left px-3 py-2 text-sm text-accent hover:bg-accent/10 rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>
                      {t('form.createPlace', 'Criar novo lugar')}: &quot;
                      <span className="font-semibold">{place.trim()}</span>&quot;
                    </span>
                  </button>
                </div>
              )}

              {/* Filtered Existing Places */}
              <div className="p-1">
                {filteredPlaces.length > 0
                  ? filteredPlaces.map((p) => {
                      const isSelected = place.toLowerCase() === p.toLowerCase();
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleSelectPlace(p)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-accent/15 text-accent font-medium'
                              : 'text-text hover:bg-warm/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-soft" />
                            <span>{p}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-accent" />}
                        </button>
                      );
                    })
                  : !place.trim() && (
                      <p className="px-3 py-2 text-xs text-soft">
                        {t(
                          'form.noPlacesYet',
                          'Nenhum lugar cadastrado ainda. Digite um nome acima!',
                        )}
                      </p>
                    )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Effort Level */}
        <div>
          <label
            htmlFor="task-effort"
            className="block text-xs uppercase tracking-widest text-soft mb-2 font-bold"
          >
            {t('form.effort')}
          </label>
          <select
            id="task-effort"
            className="w-full bg-warm border-none rounded-lg p-3 text-text focus:ring-2 focus:ring-accent outline-none appearance-none"
            value={level}
            onChange={(e) => updateLevel(e.target.value as EffortLevel)}
          >
            {Object.values(EffortLevel).map((l) => (
              <option key={l} value={l}>
                {t(`effort.${l.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Recurrence */}
        <div>
          <label
            htmlFor="task-recurrence-unit"
            className="block text-xs uppercase tracking-widest text-soft mb-2 font-bold"
          >
            {t('form.recurrence')}
          </label>
          <div className="flex gap-2">
            {recurrenceUnit !== 'none' && (
              <motion.input
                id="task-recurrence-interval"
                type="number"
                min={1}
                animate={errors.recurrenceInterval ? shakeAnimation : {}}
                className={`w-20 bg-warm border-none rounded-lg p-3 text-text focus:ring-2 outline-none ${
                  errors.recurrenceInterval ? 'ring-2 ring-red-700' : 'focus:ring-accent'
                }`}
                value={recurrenceInterval}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    updateRecurrenceInterval('');
                  } else {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      updateRecurrenceInterval(parsed);
                    }
                  }
                }}
                aria-label="Recurrence interval"
                aria-invalid={!!errors.recurrenceInterval}
              />
            )}
            <select
              id="task-recurrence-unit"
              className="flex-1 bg-warm border-none rounded-lg p-3 text-text focus:ring-2 focus:ring-accent outline-none appearance-none"
              value={recurrenceUnit}
              onChange={(e) => updateRecurrenceUnit(e.target.value as RecurrenceUnit)}
            >
              <option value="none">{t('form.units.none')}</option>
              <option value="days">{t('form.units.days')}</option>
              <option value="weeks">{t('form.units.weeks')}</option>
              <option value="months">{t('form.units.months')}</option>
              <option value="years">{t('form.units.years')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          className="flex-2 bg-success text-warm py-4 rounded-xl hover:bg-success-dark transition-all font-bold text-lg shadow-md active:scale-95"
        >
          {initialValues ? t('form.update') : t('form.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-soft/10 text-soft py-4 rounded-xl hover:bg-soft/20 transition-all font-medium active:scale-95"
        >
          {t('form.cancel')}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
