'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { loginAction, registerAction, forgotPasswordAction } from '@/app/actions';
import { APP_ROUTES } from '@/constants';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register' | 'forgot';

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

  const [mode, setMode] = useState<AuthMode>(isRegisterPath ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmailSent, setForgotEmailSent] = useState<string | null>(null);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'invalid_token'
      ? t('auth.invalidToken', 'Este link expirou ou é inválido. Solicite um novo.')
      : errorParam === 'missing_token'
        ? t('auth.invalidToken', 'Link inválido. Solicite um novo.')
        : null,
  );
  const [errorType, setErrorType] = useState<string | null>(null);

  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setErrorType(null);
    setStatus('idle');
    if (newMode === 'login' && pathname === APP_ROUTES.REGISTER) {
      router.replace(APP_ROUTES.LOGIN);
    } else if (newMode === 'register' && pathname === APP_ROUTES.LOGIN) {
      router.replace(APP_ROUTES.REGISTER);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorType(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    if (mode === 'forgot') {
      setStatus('loading');
      try {
        const result = await forgotPasswordAction(trimmedEmail);
        if (result.success) {
          setForgotEmailSent(trimmedEmail);
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
          } else {
            setErrorMessage(t('auth.invalidEmail', 'Por favor, insira um e-mail válido.'));
          }
        }
      } catch {
        setStatus('error');
        setErrorMessage('Erro de conexão ao enviar link de recuperação.');
      }
      return;
    }

    if (mode === 'register') {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        setErrorMessage(
          t('auth.invalidName', 'Por favor, informe seu nome (mínimo de 2 caracteres).'),
        );
        return;
      }

      if (password.length < 6) {
        setErrorMessage(t('auth.passwordTooShort', 'A senha deve ter pelo menos 6 caracteres.'));
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage(t('auth.passwordsDoNotMatch', 'As senhas não coincidem.'));
        return;
      }

      setStatus('loading');
      try {
        const result = await registerAction(trimmedEmail, password, trimmedName);
        if (result.success) {
          router.push(APP_ROUTES.HOME);
          router.refresh();
        } else {
          setStatus('error');
          setErrorType(result.error || null);
          if (result.error === 'account_already_exists') {
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
          } else if (result.error === 'password_too_short') {
            setErrorMessage(
              t('auth.passwordTooShort', 'A senha deve ter pelo menos 6 caracteres.'),
            );
          } else {
            setErrorMessage(
              result.error || t('auth.invalidEmail', 'Por favor, insira um e-mail válido.'),
            );
          }
        }
      } catch {
        setStatus('error');
        setErrorMessage('Erro de conexão ao criar sua conta.');
      }
      return;
    }

    // mode === 'login'
    if (!password) {
      setErrorMessage(t('auth.passwordTooShort', 'A senha deve ter pelo menos 6 caracteres.'));
      return;
    }

    setStatus('loading');
    try {
      const result = await loginAction(trimmedEmail, password);
      if (result.success) {
        router.push(APP_ROUTES.HOME);
        router.refresh();
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
        } else if (result.error === 'invalid_credentials') {
          setErrorMessage(t('auth.invalidCredentials', 'E-mail ou senha incorretos.'));
        } else {
          setErrorMessage(
            result.error || t('auth.invalidCredentials', 'E-mail ou senha incorretos.'),
          );
        }
      }
    } catch {
      setStatus('error');
      setErrorMessage('Erro de conexão ao entrar.');
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
          {mode === 'forgot'
            ? t(
                'auth.forgotPasswordSubtitle',
                'Informe seu e-mail para receber um link de redefinição de senha.',
              )
            : mode === 'register'
              ? t(
                  'auth.registerSubtitle',
                  'Crie seu espaço de tarefas com calma e intencionalidade.',
                )
              : t('auth.subtitle', 'Acesse seu espaço de tarefas com calma e foco.')}
        </p>
      </div>

      {/* Card */}
      <div className="bg-surface/30 backdrop-blur-sm px-4 py-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-surface shadow-sm">
        {mode === 'forgot' && status === 'success' ? (
          <div className="text-center py-4 space-y-4 fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-medium text-text">
              {t('auth.recoveryLinkSentTitle', 'Link enviado!')}
            </h2>
            <p className="text-soft text-sm leading-relaxed">
              {t(
                'auth.recoveryLinkSentMessage',
                'Enviamos as instruções de recuperação para {{email}}. Verifique sua caixa de entrada.',
                { email: forgotEmailSent },
              )}
            </p>
            <p className="text-xs text-soft/80 leading-relaxed bg-surface/50 border border-surface px-3 py-2 rounded-xl">
              {t(
                'auth.checkSpam',
                'Não encontrou? Verifique também sua caixa de spam ou lixo eletrônico.',
              )}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all text-sm"
              >
                {t('auth.backToLogin', 'Voltar para o login')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setForgotEmailSent(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-xs text-soft hover:text-accent transition-colors"
              >
                {t('auth.tryAnother', 'Usar outro e-mail')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switcher / Breadcrumb */}
            {mode === 'forgot' ? (
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-surface/50">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-soft hover:text-accent transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t('auth.backToLogin', 'Voltar para o login')}
                </button>
                <div className="inline-flex items-center gap-1.5 text-xs text-soft">
                  <KeyRound className="w-3.5 h-3.5 text-accent" />
                  <span>{t('auth.forgotPasswordTitle', 'Recuperar senha')}</span>
                </div>
              </div>
            ) : (
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
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                  {errorType === 'account_not_found' && mode !== 'register' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('register')}
                      className="text-xs font-medium text-accent hover:underline pl-8 block"
                    >
                      Ir para a aba Criar conta →
                    </button>
                  )}
                  {errorType === 'account_already_exists' && mode !== 'login' && (
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
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
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
                  className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
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
                    autoFocus={mode !== 'register'}
                    disabled={status === 'loading'}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-surface rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input (Login and Register) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium uppercase tracking-wider text-soft"
                    >
                      {t('auth.passwordLabel', 'Sua senha')}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('forgot')}
                        className="text-xs text-soft hover:text-accent transition-colors"
                      >
                        {t('auth.forgotPassword', 'Esqueceu a senha?')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder', 'Mínimo de 6 caracteres')}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      disabled={status === 'loading'}
                      className="w-full pl-10 pr-11 py-3 bg-surface/50 border border-surface rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-soft hover:text-text transition-colors"
                      aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password Input (Only on Register) */}
              {mode === 'register' && (
                <div className="fade-in">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
                  >
                    {t('auth.confirmPasswordLabel', 'Confirmar senha')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder', 'Repita sua senha')}
                      autoComplete="new-password"
                      disabled={status === 'loading'}
                      className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-surface rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-sm disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  status === 'loading' ||
                  !email.trim() ||
                  (mode === 'register' && (!name.trim() || !password || !confirmPassword)) ||
                  (mode === 'login' && !password)
                }
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {status === 'loading' ? (
                  <span>
                    {mode === 'forgot'
                      ? t('auth.sendingRecoveryLink', 'Enviando link...')
                      : mode === 'register'
                        ? t('auth.sendingRegister', 'Criando sua conta...')
                        : t('auth.loggingIn', 'Entrando...')}
                  </span>
                ) : (
                  <>
                    <span>
                      {mode === 'forgot'
                        ? t('auth.sendRecoveryLink', 'Enviar link de recuperação')
                        : mode === 'register'
                          ? t('auth.registerButton', 'Criar minha conta')
                          : t('auth.loginButton', 'Entrar')}
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
