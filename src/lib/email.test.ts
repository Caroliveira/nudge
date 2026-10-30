import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendMagicLinkEmail } from './email';

const mockSend = vi.fn();

vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: mockSend,
      };
    },
  };
});

describe('email.ts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('logs magic link to console when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendMagicLinkEmail({
      email: 'test@nudge.app',
      magicLinkUrl: 'http://localhost:3000/auth/verify?token=123',
    });

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('sends email using Resend when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test_key_123';
    mockSend.mockResolvedValueOnce({ data: { id: 'email_123' }, error: null });

    const result = await sendMagicLinkEmail({
      email: 'test@nudge.app',
      magicLinkUrl: 'http://localhost:3000/auth/verify?token=123',
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@nudge.app',
        subject: 'Seu link de acesso ao Nudge',
      })
    );
  });

  it('returns failure when Resend rejects', async () => {
    process.env.RESEND_API_KEY = 're_test_key_123';
    mockSend.mockRejectedValueOnce(new Error('Resend rate limit exceeded'));

    const result = await sendMagicLinkEmail({
      email: 'test@nudge.app',
      magicLinkUrl: 'http://localhost:3000/auth/verify?token=123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Resend rate limit exceeded');
  });
});
