'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ChevronDown,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/useStore';
import { PlaceNameSchema, RenamePlaceSchema } from '@/lib/schemas';

const SettingsPlaces: React.FC = () => {
  const { t } = useTranslation();
  const places = useStore((state) => state.places);
  const tasks = useStore((state) => state.tasks);
  const addPlace = useStore((state) => state.addPlace);
  const renamePlace = useStore((state) => state.renamePlace);
  const deletePlace = useStore((state) => state.deletePlace);

  const [isOpen, setIsOpen] = useState(false);
  const [newPlaceInput, setNewPlaceInput] = useState('');
  const [newPlaceError, setNewPlaceError] = useState<string | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  const [editingPlace, setEditingPlace] = useState<string | null>(null);
  const [editPlaceInput, setEditPlaceInput] = useState('');
  const [editPlaceError, setEditPlaceError] = useState<string | null>(null);
  const [isSavingPlace, setIsSavingPlace] = useState(false);

  const [deletingPlace, setDeletingPlace] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState('');
  const [isDeletingPlace, setIsDeletingPlace] = useState(false);
  const [deletePlaceError, setDeletePlaceError] = useState<string | null>(null);

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = PlaceNameSchema.safeParse(newPlaceInput);
    if (!validation.success) {
      setNewPlaceError(t('settings.places.emptyError', 'Digite um nome para o lugar.'));
      return;
    }
    const trimmed = validation.data;
    if (places.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setNewPlaceError(t('settings.places.duplicateError', 'Este lugar já existe.'));
      return;
    }
    setIsAddingPlace(true);
    setNewPlaceError(null);
    try {
      await addPlace(trimmed);
      setNewPlaceInput('');
    } catch {
      setNewPlaceError(t('common.error', 'Ocorreu um erro'));
    } finally {
      setIsAddingPlace(false);
    }
  };

  const handleStartRenamePlace = (place: string) => {
    setEditingPlace(place);
    setEditPlaceInput(place);
    setEditPlaceError(null);
    setDeletingPlace(null);
  };

  const handleSaveRenamePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;
    const validation = RenamePlaceSchema.safeParse({
      oldPlace: editingPlace,
      newPlace: editPlaceInput,
    });
    if (!validation.success) {
      setEditPlaceError(t('settings.places.emptyError', 'Digite um nome para o lugar.'));
      return;
    }
    const { newPlace: trimmed } = validation.data;
    if (
      trimmed.toLowerCase() !== editingPlace.toLowerCase() &&
      places.some((p) => p.toLowerCase() === trimmed.toLowerCase())
    ) {
      setEditPlaceError(t('settings.places.duplicateError', 'Este lugar já existe.'));
      return;
    }
    setIsSavingPlace(true);
    setEditPlaceError(null);
    try {
      await renamePlace(editingPlace, trimmed);
      setEditingPlace(null);
    } catch {
      setEditPlaceError(t('common.error', 'Ocorreu um erro'));
    } finally {
      setIsSavingPlace(false);
    }
  };

  const handleStartDeletePlace = (place: string) => {
    setDeletingPlace(place);
    setDeletePlaceError(null);
    setEditingPlace(null);
    const otherPlaces = places.filter((p) => p.toLowerCase() !== place.toLowerCase());
    const defaultTarget =
      otherPlaces.find((p) => p.toLowerCase() === 'geral') || otherPlaces[0] || '';
    setReassignTarget(defaultTarget);
  };

  const handleConfirmDeletePlace = async (place: string) => {
    const taskCount = tasks.filter(
      (t) => t.place && t.place.toLowerCase() === place.toLowerCase(),
    ).length;
    setIsDeletingPlace(true);
    setDeletePlaceError(null);
    try {
      const res = await deletePlace(place, taskCount > 0 ? reassignTarget : undefined);
      if (!res.success) {
        setDeletePlaceError(t('settings.places.deleteFailed', 'Não foi possível excluir o lugar.'));
      } else {
        setDeletingPlace(null);
      }
    } catch {
      setDeletePlaceError(t('common.error', 'Ocorreu um erro'));
    } finally {
      setIsDeletingPlace(false);
    }
  };

  return (
    <div className="bg-surface/30 p-5 sm:p-6 rounded-3xl border border-surface transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="places-accordion-content"
        className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20 shrink-0">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-text">
              {t('settings.places.title', 'Lugares da Casa')}
            </h2>
            <p className="text-xs text-soft truncate">
              {t('settings.places.subtitle', 'Gerencie os cômodos e categorias das suas tarefas')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full bg-surface text-soft font-medium border border-surface/60">
            {places.length}{' '}
            {places.length === 1
              ? t('settings.places.singular', 'lugar')
              : t('settings.places.plural', 'lugares')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-surface/50 group-hover:bg-surface flex items-center justify-center transition-colors">
            <ChevronDown
              className={`w-4 h-4 text-soft group-hover:text-text transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-accent' : ''
              }`}
              aria-hidden="true"
            />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="places-accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden space-y-4 pt-4 mt-4 border-t border-surface/50"
          >
            {/* Add place input form */}
            <form onSubmit={handleAddPlace} className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newPlaceInput}
                  onChange={(e) => {
                    setNewPlaceInput(e.target.value);
                    setNewPlaceError(null);
                  }}
                  disabled={isAddingPlace}
                  placeholder={t(
                    'settings.places.newPlaceholder',
                    'Novo lugar (ex: Varanda, Garagem...)',
                  )}
                  className="w-full px-3.5 py-2.5 text-sm bg-warm/80 rounded-xl border border-surface text-text placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingPlace || !newPlaceInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-accent text-warm hover:bg-accent/90 disabled:opacity-50 text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                {isAddingPlace ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{t('settings.places.addButton', 'Adicionar')}</span>
              </button>
            </form>

            {newPlaceError && (
              <p className="text-xs text-red-500 font-medium px-1">{newPlaceError}</p>
            )}

            {/* List of places */}
            <div className="space-y-2 pt-2">
              {places.map((place) => {
                const taskCount = tasks.filter(
                  (t) => t.place && t.place.toLowerCase() === place.toLowerCase(),
                ).length;
                const isEditing = editingPlace === place;
                const isDeleting = deletingPlace === place;

                return (
                  <div
                    key={place}
                    className="bg-surface/40 rounded-2xl p-3 border border-surface/60 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {isEditing ? (
                        <form
                          onSubmit={handleSaveRenamePlace}
                          className="flex-1 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={editPlaceInput}
                            onChange={(e) => {
                              setEditPlaceInput(e.target.value);
                              setEditPlaceError(null);
                            }}
                            disabled={isSavingPlace}
                            className="flex-1 px-3 py-1.5 text-sm bg-warm rounded-xl border border-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/20"
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={isSavingPlace || !editPlaceInput.trim()}
                            className="p-1.5 rounded-xl bg-accent text-warm hover:bg-accent/90 disabled:opacity-50"
                            title={t('common.save', 'Salvar')}
                          >
                            {isSavingPlace ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPlace(null)}
                            disabled={isSavingPlace}
                            className="p-1.5 rounded-xl hover:bg-surface text-soft hover:text-text"
                            title={t('common.cancel', 'Cancelar')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MapPin className="w-4 h-4 text-accent/80 shrink-0" />
                          <span className="font-medium text-sm text-text truncate">
                            {place}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface text-soft shrink-0">
                            {t('settings.places.taskCount', '{{count}} tarefa', {
                              count: taskCount,
                            })}
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartRenamePlace(place)}
                            className="p-1.5 rounded-lg text-soft hover:text-accent hover:bg-surface transition-colors"
                            title={t('settings.places.rename', 'Renomear')}
                            aria-label={`${t('settings.places.rename', 'Renomear')} ${place}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartDeletePlace(place)}
                            className="p-1.5 rounded-lg text-soft hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title={t('settings.places.delete', 'Excluir')}
                            aria-label={`${t('settings.places.delete', 'Excluir')} ${place}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing && editPlaceError && (
                      <p className="text-xs text-red-500 font-medium px-1">{editPlaceError}</p>
                    )}

                    {/* Delete Confirmation Box */}
                    {isDeleting && (
                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2.5 fade-in">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div className="text-xs space-y-1 flex-1">
                            <p className="font-semibold text-text">
                              {t('settings.places.deleteConfirmTitle', 'Excluir {{place}}?', {
                                place,
                              })}
                            </p>
                            {taskCount > 0 ? (
                              <div className="space-y-1.5 pt-1">
                                <p className="text-soft">
                                  {t(
                                    'settings.places.deleteWarningTasks',
                                    'Existem {{count}} tarefas neste lugar. Escolha para onde transferi-las:',
                                    { count: taskCount },
                                  )}
                                </p>
                                <select
                                  value={reassignTarget}
                                  onChange={(e) => setReassignTarget(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-warm text-text rounded-lg border border-surface text-xs focus:outline-none focus:border-accent"
                                >
                                  {places
                                    .filter((p) => p.toLowerCase() !== place.toLowerCase())
                                    .map((target) => (
                                      <option key={target} value={target}>
                                        {target}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            ) : (
                              <p className="text-soft">
                                {t(
                                  'settings.places.deleteConfirmMessage',
                                  'Nenhuma tarefa vinculada. O lugar será removido da lista.',
                                )}
                              </p>
                            )}
                            {deletePlaceError && (
                              <p className="text-red-500 font-medium">{deletePlaceError}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isDeletingPlace}
                            onClick={() => setDeletingPlace(null)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-surface bg-surface hover:bg-surface/80 text-text transition-colors font-medium disabled:opacity-50"
                          >
                            {t('common.cancel', 'Cancelar')}
                          </button>
                          <button
                            type="button"
                            disabled={isDeletingPlace || (taskCount > 0 && !reassignTarget)}
                            onClick={() => handleConfirmDeletePlace(place)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            {isDeletingPlace ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>
                              {taskCount > 0
                                ? t(
                                    'settings.places.confirmMoveAndDelete',
                                    'Transferir e Excluir',
                                  )
                                : t('settings.places.confirmDelete', 'Excluir')}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPlaces;
