'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, Sparkles, User } from 'lucide-react';
import { sendMagicLinkAction } from '@/app/actions';
import { APP_ROUTES } from '@/constants';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

export default function LoginPage({ initialMode }: LoginPageProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const isRegisterPath =
    initialMode === 'register' ||
    pathname === APP_ROUTES.REGISTER ||
    searchParams.get('mode') === 'register';

  const [mode, setMode] = useState<'login' | 'register'>(isRegisterPath ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'invalid_token'
      ? t('auth.invalidToken', 'Este link de acesso expirou ou já foi utilizado. Solicite um novo.')
      : errorParam === 'missing_token'
        ? t('auth.invalidToken', 'Link de acesso inválido. Solicite um novo.')
        : null,
  );
  const [errorType, setErrorType] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (mode === 'register' && !name.trim()) return;

    setStatus('loading');
    setErrorMessage(null);
    setErrorType(null);

    try {
      const result = await sendMagicLinkAction(email.trim(), {
        mode,
        name: mode === 'register' ? name.trim() : undefined,
      });

      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorType(result.error || null);

        if (result.error === 'account_not_found') {
          setErrorMessage(
            t(
              'auth.accountNotFound',
              'Não encontramos uma conta com este e-mail. Crie uma conta na aba ao lado!',
            ),
          );
        } else if (result.error === 'account_already_exists') {
          setErrorMessage(
            t(
              'auth.accountAlreadyExists',
              'Este e-mail já possui cadastro. Acesse pela aba "Entrar"!',
            ),
          );
        } else if (result.error === 'invalid_name') {
          setErrorMessage(
            t('auth.invalidName', 'Por favor, informe seu nome (mínimo de 2 caracteres).'),
          );
        } else {
          setErrorMessage(
            result.error || t('auth.invalidEmail', 'Por favor, insira um e-mail válido.'),
          );
        }
      }
    } catch {
      setStatus('error');
      setErrorMessage('Erro de conexão ao enviar o link de acesso.');
    }
  };

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMessage(null);
    setErrorType(null);
    if (newMode === 'login' && pathname === APP_ROUTES.REGISTER) {
      router.replace(APP_ROUTES.LOGIN);
    } else if (newMode === 'register' && pathname === APP_ROUTES.LOGIN) {
      router.replace(APP_ROUTES.REGISTER);
    }
  };

  return (
    <section className="w-full max-w-xl mx-auto py-2 sm:py-6 fade-in">
      {/* Header / Logo */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/15 text-accent mb-4 border border-accent/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-serif text-text tracking-tight mb-2">
          {t('auth.title', 'Nudge')}
        </h1>
        <p className="text-soft text-sm max-w-md mx-auto px-2 sm:px-0">
          {mode === 'register'
            ? t('auth.registerSubtitle', 'Crie seu espaço de tarefas com calma e intencionalidade.')
            : t(
                'auth.subtitle',
                'Acesse seu espaço de tarefas com calma e sem senhas para memorizar.',
              )}
        </p>
      </div>

      {/* Card */}
      <div className="bg-surface/30 backdrop-blur-sm px-4 py-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-surface shadow-sm">
        {status === 'success' ? (
          <div className="text-center py-4 space-y-4 fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-medium text-text">
              {mode === 'register'
                ? t('auth.sentRegisterTitle', 'Quase lá!')
                : t('auth.sentTitle', 'Link de acesso enviado!')}
            </h2>
            <p className="text-soft text-sm leading-relaxed">
              {mode === 'register'
                ? t(
                    'auth.sentRegisterMessage',
                    'Enviamos um link de confirmação para {{email}}. Clique nele para ativar sua conta.',
                    { email },
                  )
                : t(
                    'auth.sentMessage',
                    'Enviamos um link mágico para {{email}}. Verifique sua caixa de entrada para entrar.',
                    { email },
                  )}
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setEmail('');
                  setName('');
                }}
                className="text-xs text-soft hover:text-accent underline underline-offset-4 transition-colors"
              >
                {t('auth.tryAnother', 'Usar outro e-mail')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex bg-surface/50 p-1.5 rounded-2xl border border-surface mb-6">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  mode === 'login' ? 'bg-accent text-warm shadow-sm' : 'text-soft hover:text-text'
                }`}
              >
                {t('auth.tabLogin', 'Entrar')}
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-accent text-warm shadow-sm'
                    : 'text-soft hover:text-text'
                }`}
              >
                {t('auth.tabRegister', 'Criar conta')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                  {errorType === 'account_not_found' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('register')}
                      className="text-xs font-medium text-accent hover:underline pl-8 block"
                    >
                      Ir para a aba Criar conta →
                    </button>
                  )}
                  {errorType === 'account_already_exists' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('login')}
                      className="text-xs font-medium text-accent hover:underline pl-8 block"
                    >
                      Ir para a aba Entrar →
                    </button>
                  )}
                </div>
              )}

              {/* Name Input (Only on Register) */}
              {mode === 'register' && (
                <div className="fade-in">
                  <label
                    htmlFor="name"
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-2"
                  >
                    {t('auth.nameLabel', 'Seu nome')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('auth.namePlaceholder', 'Como prefere ser chamado(a)?')}
                      autoComplete="name"
                      autoFocus
                      disabled={status === 'loading'}
                      className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-surface rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-sm disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium uppercase tracking-wider text-soft mb-2"
                >
                  {t('auth.emailLabel', 'Seu e-mail')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder', 'seu@email.com')}
                    autoComplete="email"
                    autoFocus={mode === 'login'}
                    disabled={status === 'loading'}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-surface rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  status === 'loading' || !email.trim() || (mode === 'register' && !name.trim())
                }
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {status === 'loading' ? (
                  <span>
                    {mode === 'register'
                      ? t('auth.sendingRegister', 'Criando sua conta...')
                      : t('auth.sending', 'Enviando link...')}
                  </span>
                ) : (
                  <>
                    <span>
                      {mode === 'register'
                        ? t('auth.registerButton', 'Criar minha conta')
                        : t('auth.sendButton', 'Receber link de acesso')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-soft pt-2">
                {t('footerQuote', 'Seja intencional com sua energia.')}
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
