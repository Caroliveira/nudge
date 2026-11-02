'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  AuthLoginSchema,
  AuthLoginInput,
  AuthRegisterFormSchema,
  AuthRegisterFormInput,
  ForgotPasswordSchema,
  ForgotPasswordInput,
} from '@/lib/schemas';

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

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<AuthLoginInput>({
    resolver: zodResolver(AuthLoginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  // Register Form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<AuthRegisterFormInput>({
    resolver: zodResolver(AuthRegisterFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  // Forgot Password Form
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

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

  const onLoginSubmit = async (data: AuthLoginInput) => {
    setStatus('loading');
    setErrorMessage(null);
    setErrorType(null);
    try {
      const result = await loginAction(data.email, data.password);
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

  const onRegisterSubmit = async (data: AuthRegisterFormInput) => {
    setStatus('loading');
    setErrorMessage(null);
    setErrorType(null);
    try {
      const result = await registerAction(data.email, data.password, data.name);
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
          setErrorMessage(t('auth.passwordTooShort', 'A senha deve ter pelo menos 6 caracteres.'));
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
  };

  const onForgotSubmit = async (data: ForgotPasswordInput) => {
    setStatus('loading');
    setErrorMessage(null);
    setErrorType(null);
    try {
      const result = await forgotPasswordAction(data.email);
      if (result.success) {
        setForgotEmailSent(data.email);
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

            {/* Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm space-y-2 mb-4"
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

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
                  >
                    {t('auth.emailLabel', 'Seu e-mail')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      {...registerLogin('email')}
                      placeholder={t('auth.emailPlaceholder', 'seu@email.com')}
                      autoComplete="email"
                      autoFocus
                      disabled={status === 'loading'}
                      aria-invalid={!!loginErrors.email}
                      className={`w-full pl-10 pr-4 py-3 bg-surface/50 border rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                        loginErrors.email
                          ? 'border-red-500 focus:ring-red-500/40 focus:border-red-500'
                          : 'border-surface focus:ring-accent/40 focus:border-accent'
                      }`}
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {t('auth.invalidEmail', 'Por favor, insira um e-mail válido.')}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-medium uppercase tracking-wider text-soft"
                    >
                      {t('auth.passwordLabel', 'Sua senha')}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot')}
                      className="text-xs text-soft hover:text-accent transition-colors"
                    >
                      {t('auth.forgotPassword', 'Esqueceu a senha?')}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      {...registerLogin('password')}
                      placeholder={t('auth.passwordPlaceholder', 'Mínimo de 6 caracteres')}
                      autoComplete="current-password"
                      disabled={status === 'loading'}
                      aria-invalid={!!loginErrors.password}
                      className={`w-full pl-10 pr-11 py-3 bg-surface/50 border rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                        loginErrors.password
                          ? 'border-red-500 focus:ring-red-500/40 focus:border-red-500'
                          : 'border-surface focus:ring-accent/40 focus:border-accent'
                      }`}
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
                  {loginErrors.password && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {t('auth.passwordTooShort', 'A senha deve ter pelo menos 6 caracteres.')}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {status === 'loading' ? (
                    <span>{t('auth.loggingIn', 'Entrando...')}</span>
                  ) : (
                    <>
                      <span>{t('auth.loginButton', 'Entrar')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-soft pt-2">
                  {t('footerQuote', 'Seja intencional com sua energia.')}
                </p>
              </form>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="fade-in">
                  <label
                    htmlFor="register-name"
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
                  >
                    {t('auth.nameLabel', 'Seu nome')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="register-name"
                      type="text"
                      {...registerRegister('name')}
                      placeholder={t('auth.namePlaceholder', 'Como prefere ser chamado(a)?')}
                      autoComplete="name"
                      autoFocus
                      disabled={status === 'loading'}
                      aria-invalid={!!registerErrors.name}
                      className={`w-full pl-10 pr-4 py-3 bg-surface/50 border rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                        registerErrors.name
                          ? 'border-red-500 focus:ring-red-500/40 focus:border-red-500'
                          : 'border-surface focus:ring-accent/40 focus:border-accent'
                      }`}
                    />
                  </div>
                  {registerErrors.name && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {t(
                        'auth.invalidName',
                        'Por favor, informe seu nome (mínimo de 2 caracteres).',
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="register-email"
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
                  >
                    {t('auth.emailLabel', 'Seu e-mail')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="register-email"
                      type="email"
                      {...registerRegister('email')}
                      placeholder={t('auth.emailPlaceholder', 'seu@email.com')}
                      autoComplete="email"
                      disabled={status === 'loading'}
                      aria-invalid={!!registerErrors.email}
                      className={`w-full pl-10 pr-4 py-3 bg-surface/50 border rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                        registerErrors.email
                          ? 'border-red-500 focus:ring-red-500/40 focus:border-red-500'
                          : 'border-surface focus:ring-accent/40 focus:border-accent'
                      }`}
                    />
                  </div>
                  {registerErrors.email && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {t('auth.invalidEmail', 'Por favor, insira um e-mail válido.')}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
                  >
                    {t('auth.passwordLabel', 'Sua senha')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      {...registerRegister('password')}
                      placeholder={t('auth.passwordPlaceholder', 'Mínimo de 6 caracteres')}
                      autoComplete="new-password"
                      disabled={status === 'loading'}
                      aria-invalid={!!registerErrors.password}
                      className={`w-full pl-10 pr-11 py-3 bg-surface/50 border rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                        registerErrors.password
                          ? 'border-red-500 focus:ring-red-500/40 focus:border-red-500'
                          : 'border-surface focus:ring-accent/40 focus:border-accent'
                      }`}
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
                  {registerErrors.password && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {t('auth.passwordTooShort', 'A senha deve ter pelo menos 6 caracteres.')}
                    </p>
                  )}
                </div>

                <div className="fade-in">
                  <label
                    htmlFor="register-confirmPassword"
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
                  >
                    {t('auth.confirmPasswordLabel', 'Confirmar senha')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="register-confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      {...registerRegister('confirmPassword')}
                      placeholder={t('auth.confirmPasswordPlaceholder', 'Repita sua senha')}
                      autoComplete="new-password"
                      disabled={status === 'loading'}
                      aria-invalid={!!registerErrors.confirmPassword}
                      className={`w-full pl-10 pr-4 py-3 bg-surface/50 border rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                        registerErrors.confirmPassword
                          ? 'border-red-500 focus:ring-red-500/40 focus:border-red-500'
                          : 'border-surface focus:ring-accent/40 focus:border-accent'
                      }`}
                    />
                  </div>
                  {registerErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {t('auth.passwordsDoNotMatch', 'As senhas não coincidem.')}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {status === 'loading' ? (
                    <span>{t('auth.sendingRegister', 'Criando sua conta...')}</span>
                  ) : (
                    <>
                      <span>{t('auth.registerButton', 'Criar minha conta')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-soft pt-2">
                  {t('footerQuote', 'Seja intencional com sua energia.')}
                </p>
              </form>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
                  >
                    {t('auth.emailLabel', 'Seu e-mail')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      {...registerForgot('email')}
                      placeholder={t('auth.emailPlaceholder', 'seu@email.com')}
                      autoComplete="email"
                      autoFocus
                      disabled={status === 'loading'}
                      aria-invalid={!!forgotErrors.email}
                      className={`w-full pl-10 pr-4 py-3 bg-surface/50 border rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                        forgotErrors.email
                          ? 'border-red-500 focus:ring-red-500/40 focus:border-red-500'
                          : 'border-surface focus:ring-accent/40 focus:border-accent'
                      }`}
                    />
                  </div>
                  {forgotErrors.email && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {t('auth.invalidEmail', 'Por favor, insira um e-mail válido.')}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {status === 'loading' ? (
                    <span>{t('auth.sendingRecoveryLink', 'Enviando link...')}</span>
                  ) : (
                    <>
                      <span>{t('auth.sendRecoveryLink', 'Enviar link de recuperação')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-soft pt-2">
                  {t('footerQuote', 'Seja intencional com sua energia.')}
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </section>
  );
}
