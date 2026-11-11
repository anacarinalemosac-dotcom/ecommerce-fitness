import fs from 'fs';
import path from 'path';
import { supabaseServer } from '@/lib/supabaseServer';
import { readConditionals } from '@/lib/conditionalsStore';

export const MARKETING_CONTACTS_ROW_ID = '00000000-0000-0000-0000-000000000091';
export const MARKETING_CONTACTS_SLUG = '__marketing_contacts_state__';

export interface MarketingContact {
  id: string;
  name: string;
  phone: string;
  phone_digits: string;
  email: string;
  city: string;
  state: string;
  sizes_bought: string[];
  orders_count: number;
  total_spent: number;
  last_product: string;
  last_order_date: string;
  sources: string[];
  notes: string;
  opted_out?: boolean;
  created_at: string;
  updated_at: string;
}

function getLocalContactsFilePath(): string {
  const candidates = [
    path.join(process.cwd(), 'apps', 'web', 'marketing_contacts_db.json'),
    path.join(process.cwd(), 'marketing_contacts_db.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.dirname(candidate))) {
      return candidate;
    }
  }
  return candidates[0];
}

export function normalizePhoneDigits(raw?: string | null): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export function formatPhoneDisplay(raw?: string | null): string {
  const digits = normalizePhoneDigits(raw);
  if (!digits) return String(raw || '').trim();
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (raw && String(raw).trim()) return String(raw).trim();
  return `+${digits}`;
}

function isPlaceholderName(name?: string | null): boolean {
  const n = String(name || '').trim().toLowerCase();
  return (
    !n ||
    n === 'cliente' ||
    n === 'cliente online' ||
    n === 'cliente stripe' ||
    n === 'cliente balcão' ||
    n === 'cliente showroom' ||
    n === 'cliente vip'
  );
}

function isPlaceholderEmail(email?: string | null): boolean {
  const e = String(email || '').trim().toLowerCase();
  return !e || !e.includes('@') || e === 'cliente@exemplo.com' || e === 'cliente@stripe.com' || e === 'pdv@anafit.com';
}

function readLocalContacts(): MarketingContact[] {
  try {
    const filePath = getLocalContactsFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao ler marketing_contacts_db.json:', err);
  }
  return [];
}

function writeLocalContacts(list: MarketingContact[]): void {
  try {
    const filePath = getLocalContactsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('Erro ao gravar marketing_contacts_db.json:', err);
  }
}

export async function loadMarketingContacts(): Promise<MarketingContact[]> {
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', MARKETING_CONTACTS_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      const parsed = JSON.parse(row.description);
      if (Array.isArray(parsed)) {
        writeLocalContacts(parsed);
        return parsed;
      }
    }
  } catch (_) {}
  return readLocalContacts();
}

export async function saveMarketingContacts(list: MarketingContact[]): Promise<void> {
  writeLocalContacts(list);
  try {
    const { data: existing } = await supabaseServer
      .from('products')
      .select('id')
      .eq('id', MARKETING_CONTACTS_ROW_ID)
      .maybeSingle();

    const payloadDesc = JSON.stringify(list);
    if (existing) {
      await supabaseServer
        .from('products')
        .update({ description: payloadDesc })
        .eq('id', MARKETING_CONTACTS_ROW_ID);
    } else {
      await supabaseServer.from('products').insert([
        {
          id: MARKETING_CONTACTS_ROW_ID,
          title: '__MARKETING_CONTACTS_STATE__',
          slug: MARKETING_CONTACTS_SLUG,
          description: payloadDesc,
        },
      ]);
    }
  } catch (err) {
    console.warn('Erro ao persistir marketing contacts no Supabase:', err);
  }
}

export interface UpsertContactPayload {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  sizes?: string[];
  last_product?: string;
  order_value?: number;
  count_order?: boolean;
  source?: string;
  notes?: string;
  created_at?: string;
}

export function mergeContactIntoList(
  list: MarketingContact[],
  input: UpsertContactPayload
): MarketingContact[] {
  const cleanName = String(input.name || '').trim();
  const cleanEmail = isPlaceholderEmail(input.email) ? '' : String(input.email || '').trim().toLowerCase();
  const phoneDigits = normalizePhoneDigits(input.phone);
  const formattedPhone = phoneDigits ? formatPhoneDisplay(phoneDigits) : '';

  // Skip completely empty placeholder entries with no phone, no email, and no real name
  if (!phoneDigits && !cleanEmail && isPlaceholderName(cleanName)) {
    return list;
  }

  const incomingSizes = Array.isArray(input.sizes)
    ? input.sizes
        .map((s) => String(s || '').trim().toUpperCase())
        .filter((s) => s && s !== 'ONE SIZE' && s !== 'M' ? true : Boolean(s))
    : [];

  const idx = list.findIndex((c) => {
    if (phoneDigits && c.phone_digits && c.phone_digits === phoneDigits) return true;
    if (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail) return true;
    if (!isPlaceholderName(cleanName) && c.name.trim().toUpperCase() === cleanName.toUpperCase()) {
      // Merge same-name record if phone/email doesn't conflict
      const phoneConflict = Boolean(phoneDigits && c.phone_digits && phoneDigits !== c.phone_digits);
      const emailConflict = Boolean(cleanEmail && c.email && cleanEmail !== c.email.toLowerCase());
      return !phoneConflict && !emailConflict;
    }
    return false;
  });

  const nowIso = new Date().toISOString();
  const eventDate = input.created_at || nowIso;

  if (idx >= 0) {
    const existing = list[idx];
    const mergedSizes = Array.from(new Set([...(existing.sizes_bought || []), ...incomingSizes]));
    const mergedSources = Array.from(new Set([...(existing.sources || []), ...(input.source ? [input.source] : [])]));
    const isNewer = !existing.last_order_date || new Date(eventDate) >= new Date(existing.last_order_date);

    const updated: MarketingContact = {
      ...existing,
      name: (!isPlaceholderName(cleanName) && (isPlaceholderName(existing.name) || cleanName.length >= existing.name.length))
        ? cleanName
        : existing.name,
      phone: formattedPhone || existing.phone,
      phone_digits: phoneDigits || existing.phone_digits,
      email: cleanEmail || existing.email,
      city: input.city && input.city !== 'Online' ? input.city : existing.city || input.city || '',
      state: input.state && input.state !== 'EUA' ? input.state : existing.state || input.state || '',
      sizes_bought: mergedSizes,
      orders_count: existing.orders_count + (input.count_order ? 1 : 0),
      total_spent: Number((existing.total_spent + (Number(input.order_value) || 0)).toFixed(2)),
      last_product: isNewer && input.last_product ? input.last_product : existing.last_product,
      last_order_date: isNewer ? eventDate : existing.last_order_date,
      sources: mergedSources,
      notes: input.notes
        ? (existing.notes && !existing.notes.includes(input.notes) ? `${existing.notes} | ${input.notes}` : input.notes)
        : existing.notes,
      updated_at: nowIso,
    };

    const copy = [...list];
    copy[idx] = updated;
    return copy;
  }

  const newContact: MarketingContact = {
    id: `mkt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: !isPlaceholderName(cleanName) ? cleanName : (formattedPhone || cleanEmail || 'Cliente VIP'),
    phone: formattedPhone,
    phone_digits: phoneDigits,
    email: cleanEmail,
    city: input.city || '',
    state: input.state || '',
    sizes_bought: Array.from(new Set(incomingSizes)),
    orders_count: input.count_order ? 1 : 0,
    total_spent: Number((Number(input.order_value) || 0).toFixed(2)),
    last_product: input.last_product || '',
    last_order_date: eventDate,
    sources: input.source ? [input.source] : ['SITE'],
    notes: input.notes || '',
    opted_out: false,
    created_at: nowIso,
    updated_at: nowIso,
  };

  return [newContact, ...list];
}

export async function upsertMarketingContactAndPersist(input: UpsertContactPayload): Promise<MarketingContact[]> {
  const current = await loadMarketingContacts();
  const next = mergeContactIntoList(current, input);
  await saveMarketingContacts(next);
  return next;
}

/**
 * Rebuilds/synchronizes the Marketing Contacts list from ALL orders, conditionals, and customer accounts,
 * while preserving manually added phone contacts, notes, and opt-out flags.
 */
export async function syncMarketingContactsFromAllSources(): Promise<MarketingContact[]> {
  const existing = await loadMarketingContacts();

  // Keep manual contacts, opt-outs & custom notes untouched; recalculate order totals cleanly from live orders
  const manualOnly = existing.filter((c) => c.sources?.includes('WHATSAPP_MANUAL') || c.orders_count === 0);
  const metaMap = new Map<string, { opted_out?: boolean; notes?: string; manualSizes?: string[] }>();
  for (const c of existing) {
    const k = c.phone_digits || c.email || c.name.toUpperCase();
    if (k) {
      metaMap.set(k, {
        opted_out: c.opted_out,
        notes: c.notes,
        manualSizes: c.sources?.includes('WHATSAPP_MANUAL') ? c.sizes_bought : [],
      });
    }
  }

  let rebuilt: MarketingContact[] = manualOnly.map((c) => ({
    ...c,
    orders_count: 0,
    total_spent: 0,
  }));

  // 1. Collect all orders from Supabase orders table + local backup
  const seenOrderKeys = new Set<string>();
  const allOrders: any[] = [];

  try {
    const { data: dbOrders } = await supabaseServer
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (Array.isArray(dbOrders)) {
      for (const o of dbOrders) {
        if (o.status === 'CANCELLED') continue;
        const meta = typeof o.shipping_address === 'object' && o.shipping_address ? o.shipping_address : {};
        const ordNum = meta.order_number || o.id;
        if (String(ordNum).startsWith('OUT-') || o.channel === 'WRITE_OFF') continue;
        seenOrderKeys.add(ordNum);
        allOrders.push({
          customer_name: o.customer_name,
          customer_email: o.customer_email || meta.customer_email,
          customer_phone: o.customer_phone || meta.customer_phone,
          channel: o.channel === 'ONLINE' && meta.channel_detail !== 'POS_COUNTER' ? 'SITE' : 'BALCAO_PDV',
          city: meta.address?.city || '',
          state: meta.address?.state || '',
          items: Array.isArray(meta.items) ? meta.items : [],
          total_spent: Number(o.total_amount) || Number(o.subtotal_amount) || 0,
          created_at: o.created_at,
        });
      }
    }
  } catch (_) {}

  try {
    const backupPath = path.join(process.cwd(), 'sales_history_db.json');
    if (fs.existsSync(backupPath)) {
      const localOrders = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      if (Array.isArray(localOrders)) {
        for (const o of localOrders) {
          if (o.status === 'CANCELLED' || o.channel === 'WRITE_OFF' || String(o.order_id || '').startsWith('OUT-')) continue;
          const ordNum = o.order_id || o.id;
          if (seenOrderKeys.has(ordNum)) continue;
          seenOrderKeys.add(ordNum);
          allOrders.push({
            customer_name: o.customer_name,
            customer_email: o.customer_email,
            customer_phone: o.customer_phone,
            channel: o.channel === 'ONLINE' ? 'SITE' : 'BALCAO_PDV',
            city: o.shipping_address?.city || '',
            state: o.shipping_address?.state || '',
            items: Array.isArray(o.items) ? o.items : [],
            total_spent: Number(o.total_amount) || Number(o.subtotal_products) || 0,
            created_at: o.created_at,
          });
        }
      }
    }
  } catch (_) {}

  for (const ord of allOrders) {
    const items = Array.isArray(ord.items) ? ord.items : [];
    const sizes = items.map((it: any) => it.size).filter(Boolean);
    const lastProduct = items[0]?.title || items[0]?.sku || '';
    rebuilt = mergeContactIntoList(rebuilt, {
      name: ord.customer_name,
      phone: ord.customer_phone,
      email: ord.customer_email,
      city: ord.city,
      state: ord.state,
      sizes,
      last_product: lastProduct,
      order_value: ord.total_spent,
      count_order: true,
      source: ord.channel,
      created_at: ord.created_at,
    });
  }

  // 2. Include customer phone/email contacts from Conditionals (Malas Condicionais)
  try {
    const conditionals = readConditionals();
    for (const cond of conditionals) {
      rebuilt = mergeContactIntoList(rebuilt, {
        name: cond.customer_name,
        phone: cond.customer_phone,
        email: cond.customer_email,
        sizes: Array.isArray(cond.items) ? cond.items.map((it: any) => it.size).filter(Boolean) : [],
        last_product: cond.items?.[0]?.title || '',
        order_value: 0,
        count_order: false,
        source: 'CONDICIONAL',
        created_at: cond.created_at,
      });
    }
  } catch (_) {}

  // 3. Reapply preserved opt_out / manual notes
  rebuilt = rebuilt.map((c) => {
    const k = c.phone_digits || c.email || c.name.toUpperCase();
    const preserved = metaMap.get(k);
    return preserved
      ? {
          ...c,
          opted_out: preserved.opted_out ?? c.opted_out,
          notes: preserved.notes || c.notes,
          sizes_bought: Array.from(new Set([...(c.sizes_bought || []), ...(preserved.manualSizes || [])])),
        }
      : c;
  });

  // Sort: contacts with WhatsApp phone first, then newest/highest spent
  rebuilt.sort((a, b) => {
    const aHasPhone = a.phone_digits ? 1 : 0;
    const bHasPhone = b.phone_digits ? 1 : 0;
    if (aHasPhone !== bHasPhone) return bHasPhone - aHasPhone;
    const tDiff = new Date(b.last_order_date || b.updated_at).getTime() - new Date(a.last_order_date || a.updated_at).getTime();
    if (!isNaN(tDiff) && tDiff !== 0) return tDiff;
    return (b.total_spent || 0) - (a.total_spent || 0);
  });

  await saveMarketingContacts(rebuilt);
  return rebuilt;
}
