import '@testing-library/jest-dom';
import { vi } from 'vitest';
import en from './locales/en.json';

if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => 'test-global-cripto-random-uuid' },
  });
} else if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => 'test-global-cripto-random-uuid';
}

window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const keys = key.split('.');
      let value: any = en;
      for (const k of keys) {
        value = value?.[k];
      }

      // Handle pluralization (basic)
      if (options?.count !== undefined && typeof options.count === 'number') {
        const suffix = options.count === 1 ? '' : '_other';
        const pluralKey = `${key}${suffix}`;
        // Try to find plural key in en.json
        const pluralKeys = pluralKey.split('.');
        let pluralValue: any = en;
        for (const k of pluralKeys) {
          pluralValue = pluralValue?.[k];
        }
        if (pluralValue) {
          value = pluralValue;
        }
      }

      // Handle interpolation
      if (typeof value === 'string' && options) {
        Object.keys(options).forEach((optKey) => {
          value = value.replace(`{{${optKey}}}`, options[optKey]);
        });
      }

      return value || key;
    },
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import React from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));
