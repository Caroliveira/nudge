'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileSpreadsheet,
  Languages,
  User,
  LogOut,
  Trash2,
  AlertTriangle,
  Loader2,
  Pencil,
  Check,
  X,
  MapPin,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { SUPPORTED_LANGUAGES, APP_ROUTES } from '../constants';
import CsvExport from '@/components/CsvExport';
import CsvImport from '@/components/CsvImport';
import { useStore } from '@/store/useStore';
import { logoutAction, deleteAccountAction, updateUserNameAction } from '@/app/actions';
import { PlaceNameSchema, RenamePlaceSchema, UpdateUserNameSchema } from '@/lib/schemas';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const userName = useStore((state) => state.userName);
  const userEmail = useStore((state) => state.userEmail);
  const setUserName = useStore((state) => state.setUserName);
  const resetStore = useStore((state) => state.resetStore);
  const places = useStore((state) => state.places);
  const tasks = useStore((state) => state.tasks);
  const addPlace = useStore((state) => state.addPlace);
  const renamePlace = useStore((state) => state.renamePlace);
  const deletePlace = useStore((state) => state.deletePlace);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Accordion States
  const [isPlacesAccordionOpen, setIsPlacesAccordionOpen] = useState(false);
  const [isCsvAccordionOpen, setIsCsvAccordionOpen] = useState(false);
  const [isLanguageAccordionOpen, setIsLanguageAccordionOpen] = useState(false);
  const [isAccountAccordionOpen, setIsAccountAccordionOpen] = useState(false);

  // Places Management State
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

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleLogout = async () => {
    await logoutAction();
    resetStore();
    router.push(APP_ROUTES.LOGIN);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = UpdateUserNameSchema.safeParse({ newName: nameInput });
    if (!validation.success) {
      setNameError(t('auth.nameMinLength', 'O nome deve ter pelo menos 2 caracteres.'));
      return;
    }

    setIsSavingName(true);
    setNameError(null);
    try {
      const result = await updateUserNameAction(validation.data.newName);
      if (result.success && result.name) {
        setUserName(result.name);
        setIsEditingName(false);
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
      } else {
        setNameError(result.error || t('common.error', 'Ocorreu um erro'));
      }
    } catch {
      setNameError(t('common.error', 'Ocorreu um erro'));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteAccountAction();
      if (result.success) {
        resetStore();
        router.push(APP_ROUTES.LOGIN);
      } else {
        setDeleteError(result.error || 'Failed to delete account');
      }
    } catch {
      setDeleteError('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.resolvedLanguage)?.label ||
    SUPPORTED_LANGUAGES[0]?.label ||
    'English';

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
        {/* Places / House Areas Section (Accordion) */}
        <div className="bg-surface/30 p-5 sm:p-6 rounded-3xl border border-surface transition-all">
          <button
            type="button"
            onClick={() => setIsPlacesAccordionOpen((prev) => !prev)}
            aria-expanded={isPlacesAccordionOpen}
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
                  {t(
                    'settings.places.subtitle',
                    'Gerencie os cômodos e categorias das suas tarefas',
                  )}
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
                    isPlacesAccordionOpen ? 'rotate-180 text-accent' : ''
                  }`}
                  aria-hidden="true"
                />
              </div>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {isPlacesAccordionOpen && (
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

        {/* CSV / Backup Section (Accordion) */}
        <div className="bg-surface/30 p-5 sm:p-6 rounded-3xl border border-surface transition-all">
          <button
            type="button"
            onClick={() => setIsCsvAccordionOpen((prev) => !prev)}
            aria-expanded={isCsvAccordionOpen}
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
                  isCsvAccordionOpen ? 'rotate-180 text-accent' : ''
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {isCsvAccordionOpen && (
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

        {/* Language Section (Accordion) */}
        <div className="bg-surface/30 p-5 sm:p-6 rounded-3xl border border-surface transition-all">
          <button
            type="button"
            onClick={() => setIsLanguageAccordionOpen((prev) => !prev)}
            aria-expanded={isLanguageAccordionOpen}
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
                  isLanguageAccordionOpen ? 'rotate-180 text-accent' : ''
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {isLanguageAccordionOpen && (
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

        {/* Account Section (Accordion) */}
        <div className="bg-surface/30 p-5 sm:p-6 rounded-3xl border border-surface transition-all">
          <button
            type="button"
            onClick={() => setIsAccountAccordionOpen((prev) => !prev)}
            aria-expanded={isAccountAccordionOpen}
            aria-controls="account-accordion-content"
            className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20 shrink-0">
                <User className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-text">
                  {t('settings.account.title', t('auth.account', 'Conta'))}
                </h2>
                <p className="text-xs text-soft truncate">
                  {userEmail
                    ? `${t('auth.loggedInAs', 'Conectado como')} ${userEmail}`
                    : t('auth.localAccount', 'Conta local')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface text-soft border border-surface max-w-[140px] sm:max-w-[180px] truncate">
                {userName || (userEmail ? userEmail.split('@')[0] : t('auth.account', 'Conta'))}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-soft transition-transform duration-200 group-hover:text-text ${
                  isAccountAccordionOpen ? 'rotate-180 text-accent' : ''
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {isAccountAccordionOpen && (
              <motion.div
                id="account-accordion-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-5 border-t border-surface/50 mt-5">
                  <div className="bg-surface/40 rounded-2xl p-4 border border-surface/60 space-y-3">
                    {/* Name Field with Inline Editing */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-soft block">
                        {t('auth.nameLabel', 'Seu nome')}
                      </span>

                      {isEditingName ? (
                        <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => {
                              setNameInput(e.target.value);
                              setNameError(null);
                            }}
                            disabled={isSavingName}
                            placeholder={t('auth.namePlaceholder', 'Como prefere ser chamado(a)?')}
                            className="flex-1 px-3 py-1.5 text-sm bg-warm/80 rounded-xl border border-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={isSavingName || nameInput.trim().length < 2}
                            className="px-3 py-1.5 rounded-xl bg-accent text-warm hover:bg-accent/90 disabled:opacity-50 text-xs font-medium inline-flex items-center gap-1 transition-all shadow-sm"
                          >
                            {isSavingName ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{t('auth.saveName', 'Salvar')}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSavingName}
                            onClick={() => {
                              setIsEditingName(false);
                              setNameInput(userName || '');
                              setNameError(null);
                            }}
                            className="p-1.5 rounded-xl hover:bg-surface text-soft hover:text-text transition-colors"
                            title={t('auth.cancel', 'Cancelar')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-base font-medium text-text truncate">
                            {userName || '—'}
                          </span>
                          {userEmail && (
                            <button
                              type="button"
                              onClick={() => {
                                setNameInput(userName || '');
                                setIsEditingName(true);
                                setNameError(null);
                                setNameSuccess(false);
                              }}
                              className="p-1 rounded-lg hover:bg-surface text-soft hover:text-accent transition-colors"
                              title={t('auth.editName', 'Editar nome')}
                              aria-label={t('auth.editName', 'Editar nome')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      <AnimatePresence>
                        {nameError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs text-red-500 pt-0.5"
                          >
                            {nameError}
                          </motion.p>
                        )}
                        {nameSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg mt-1"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>{t('auth.nameUpdated', 'Nome atualizado!')}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Email Field */}
                    {userEmail && (
                      <div className="pt-2.5 border-t border-surface/50 space-y-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-soft block">
                          {t('auth.emailLabel', 'Seu e-mail')}
                        </span>
                        <span className="text-sm text-soft font-mono block truncate">
                          {userEmail}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions Row: Sign out and Delete account */}
                  {userEmail && (
                    <div className="pt-2 border-t border-surface/50 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface hover:border-red-500/30 text-soft hover:text-red-500 bg-surface/30 hover:bg-red-500/10 transition-all text-xs font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('auth.logout', 'Sair da conta')}</span>
                        </button>

                        {!showDeleteConfirm && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setDeleteError(null);
                            }}
                            className="text-xs text-soft/70 hover:text-red-500 transition-colors py-1.5 px-2 rounded-xl inline-flex items-center gap-1.5 focus:outline-none"
                            aria-label={t('auth.deleteAccount', 'Excluir conta')}
                          >
                            <Trash2 className="w-3.5 h-3.5 opacity-60" />
                            <span>{t('auth.deleteAccount', 'Excluir conta')}</span>
                          </button>
                        )}
                      </div>

                      {showDeleteConfirm && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3 fade-in">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold text-text">
                                {t(
                                  'auth.deleteAccountConfirmTitle',
                                  'Excluir conta permanentemente?',
                                )}
                              </h4>
                              <p className="text-xs text-soft leading-relaxed">
                                {t(
                                  'auth.deleteAccountConfirmMessage',
                                  'Todos os seus hábitos, tarefas e histórico serão apagados definitivamente. Esta ação não pode ser desfeita.',
                                )}
                              </p>
                              {deleteError && (
                                <p className="text-xs text-red-500 font-medium">{deleteError}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-3 py-1.5 text-xs rounded-xl border border-surface bg-surface hover:bg-surface/80 text-text transition-colors font-medium disabled:opacity-50"
                            >
                              {t('auth.cancel', 'Cancelar')}
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={handleDeleteAccount}
                              className="px-3 py-1.5 text-xs rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>{t('auth.deletingAccount', 'Excluindo...')}</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>
                                    {t(
                                      'auth.deleteAccountConfirmButton',
                                      'Sim, excluir minha conta',
                                    )}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
