import { describe, expect, it } from 'vitest';

import {
  buildOrganizationInvitationEmailContent,
  buildPasswordResetEmailContent,
} from '../email.templates';

describe('email templates', () => {
  it('escapes user-controlled values in password reset HTML', () => {
    const { html, text } = buildPasswordResetEmailContent({
      resetUrl: 'https://soflia.ai/reset?token="abc"',
      username: '<script>alert("x")</script>',
      year: 2026,
    });

    expect(html).toContain(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
    expect(html).toContain('token=&quot;abc&quot;');
    expect(text).toContain('<script>alert("x")</script>');
  });

  it('sanitizes invitation HTML and normalizes relative asset URLs', () => {
    const { html, text } = buildOrganizationInvitationEmailContent({
      registerUrl: 'https://soflia.ai/auth/acme/register?token=abc',
      organizationName: 'ACME <b>Corp</b>',
      customMessage: '<img src=x onerror=alert(1)>',
      organizationLogoUrl: '/logos/acme.png',
      appUrl: 'https://soflia.ai',
      year: 2026,
    });

    expect(html).toContain('https://soflia.ai/logos/acme.png');
    expect(html).toContain('ACME &lt;b&gt;Corp&lt;/b&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('onerror=alert(1)"');
    expect(text).toContain('Mensaje del administrador');
  });

  it('uses a hosted SofLIA logo when the app URL is localhost', () => {
    const { html } = buildOrganizationInvitationEmailContent({
      registerUrl: 'http://localhost:3000/auth/acme/register?token=abc',
      organizationName: 'ACME',
      appUrl: 'http://localhost:3000',
    });

    expect(html).toContain(
      'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/logo.png'
    );
  });
});
