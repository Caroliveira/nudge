import { Resend } from 'resend';

export interface SendPasswordResetParams {
  email: string;
  resetUrl: string;
  name?: string;
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
  name,
}: SendPasswordResetParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Development or test mode: output reset link directly to terminal
    console.log('\n=============================================================');
    console.log(`[Nudge Dev Auth] Recuperação de Senha para: ${email}${name ? ` (${name})` : ''}`);
    console.log(`URL: ${resetUrl}`);
    console.log('=============================================================\n');
    return { success: true };
  }

  try {
    const resend = new Resend(apiKey);
    const fromAddress = process.env.EMAIL_FROM || 'Nudge <onboarding@resend.dev>';
    const greeting = name ? `Olá, ${name}!` : 'Olá!';

    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: 'Recuperação de senha - Nudge',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; color: #1e293b; background-color: #faf8f5; border-radius: 16px; border: 1px solid #f1ece4;">
          <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: normal; color: #1c1917; margin-top: 0; margin-bottom: 16px;">
            Nudge
          </h1>
          <p style="font-size: 16px; line-height: 1.6; color: #44403c; margin-bottom: 24px;">
            ${greeting} Você solicitou a redefinição da sua senha no Nudge. Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>15 minutos</strong>.
          </p>
          <div style="margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #292524; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-block;">
              Redefinir minha senha
            </a>
          </div>
          <p style="font-size: 13px; line-height: 1.5; color: #78716c; margin-top: 32px; border-top: 1px solid #e7e5e4; padding-top: 16px;">
            Se você não solicitou a redefinição de senha, nenhuma ação é necessária. Sua senha continuará segura e você pode ignorar este e-mail.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Falha ao enviar e-mail de recuperação';
    console.error('[Resend Error]', error);
    return {
      success: false,
      error: message,
    };
  }
}
