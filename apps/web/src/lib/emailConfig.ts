import fs from 'fs';
import path from 'path';
import { supabaseServer } from '@/lib/supabaseServer';

export interface EmailConfig {
  provider: 'gmail' | 'resend' | 'custom_smtp' | 'simulated';
  fromName: string;
  fromEmail: string;
  ownerNotificationEmail: string;
  sendToCustomerOnPurchase: boolean;
  sendToOwnerOnPurchase: boolean;
  sendOnShippingWithTracking: boolean;

  // Gmail / Google Workspace (SMTP)
  gmailUser?: string;
  gmailAppPassword?: string;

  // Resend API
  resendApiKey?: string;

  // SMTP Personalizado
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;

  updatedAt?: string;
}

const SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000098';

function getLocalSettingsPath(): string {
  const candidates = [
    path.join(process.cwd(), 'apps', 'web', 'site_settings_db.json'),
    path.join(process.cwd(), 'site_settings_db.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.dirname(candidate))) {
      return candidate;
    }
  }
  return candidates[0];
}

export function getDefaultEmailConfig(): EmailConfig {
  const envGmailUser = process.env.GMAIL_USER || '';
  const envGmailPass = process.env.GMAIL_APP_PASSWORD || '';
  const envResendKey = process.env.RESEND_API_KEY || '';
  const envFrom = process.env.EMAIL_FROM || '';

  let initialProvider: 'gmail' | 'resend' | 'custom_smtp' | 'simulated' = 'simulated';
  if (envGmailUser && envGmailPass) {
    initialProvider = 'gmail';
  } else if (envResendKey) {
    initialProvider = 'resend';
  }

  return {
    provider: initialProvider,
    fromName: 'ANA Fitness Wear',
    fromEmail: envFrom.includes('<') ? envFrom.split('<')[1].replace('>', '').trim() : (envFrom || 'anafitweareua@gmail.com'),
    ownerNotificationEmail: process.env.STORE_OWNER_EMAIL || 'anafitweareua@gmail.com, anacarinalemos.ac@gmail.com',
    sendToCustomerOnPurchase: true,
    sendToOwnerOnPurchase: true,
    sendOnShippingWithTracking: true,
    gmailUser: envGmailUser || 'anafitweareua@gmail.com',
    gmailAppPassword: envGmailPass || '',
    resendApiKey: envResendKey || '',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT) || 465,
    smtpSecure: true,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
  };
}

export function getEmailConfig(): EmailConfig {
  const defaults = getDefaultEmailConfig();
  try {
    const filePath = getLocalSettingsPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      if (data && data.emailConfig && typeof data.emailConfig === 'object') {
        return {
          ...defaults,
          ...data.emailConfig,
        };
      }
    }
  } catch (err) {
    console.warn('[getEmailConfig] Erro ao ler configuração local:', err);
  }
  return defaults;
}

export async function saveEmailConfig(partial: Partial<EmailConfig>): Promise<EmailConfig> {
  const current = getEmailConfig();
  const updated: EmailConfig = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  // 1. Salva no site_settings_db.json local
  try {
    const filePath = getLocalSettingsPath();
    let siteSettings: any = {};
    if (fs.existsSync(filePath)) {
      try {
        siteSettings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (_) {}
    }
    siteSettings.emailConfig = updated;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(siteSettings, null, 2), 'utf8');
  } catch (err) {
    console.warn('[saveEmailConfig] Erro ao gravar site_settings_db.json local:', err);
  }

  // 2. Persiste no Supabase para sincronização em nuvem
  try {
    const { data: row } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    let remoteSettings: any = {};
    if (row?.description) {
      try {
        remoteSettings = JSON.parse(row.description);
      } catch (_) {}
    }
    remoteSettings.emailConfig = updated;

    await supabaseServer.from('products').upsert({
      id: SETTINGS_ROW_ID,
      title: '__SITE_SETTINGS_STATE__',
      slug: '__site_settings_state__',
      description: JSON.stringify(remoteSettings),
    });
  } catch (err) {
    console.warn('[saveEmailConfig] Erro ao sincronizar com Supabase:', err);
  }

  return updated;
}

// Retorna configuração segura para exibição no front-end (senhas e chaves mascaradas)
export function getMaskedEmailConfig(config: EmailConfig) {
  const mask = (str?: string) => {
    if (!str) return '';
    if (str.length <= 4) return '••••';
    return `${str.slice(0, 3)}••••••••${str.slice(-3)}`;
  };

  return {
    ...config,
    hasGmailPassword: Boolean(config.gmailAppPassword && config.gmailAppPassword.trim().length > 0),
    gmailAppPasswordMasked: mask(config.gmailAppPassword),
    hasResendApiKey: Boolean(config.resendApiKey && config.resendApiKey.trim().length > 0),
    resendApiKeyMasked: mask(config.resendApiKey),
    hasSmtpPass: Boolean(config.smtpPass && config.smtpPass.trim().length > 0),
    smtpPassMasked: mask(config.smtpPass),
  };
}
