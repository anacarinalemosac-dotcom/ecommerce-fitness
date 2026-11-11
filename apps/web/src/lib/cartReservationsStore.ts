import fs from 'fs';
import path from 'path';
import { supabaseServer } from '@/lib/supabaseServer';

export const CART_HOLD_TTL_MS = 3 * 60 * 60 * 1000; // 3 horas exatas em milissegundos
export const CART_RESERVATIONS_ROW_ID = '00000000-0000-0000-0000-000000000089';
export const CART_RESERVATIONS_SLUG = '__cart_reservations_state__';

export interface CartReservationRecord {
  session_id: string;
  key: string;
  alt_key: string;
  sku: string;
  slug: string;
  size: string;
  color: string;
  quantity: number;
  expires_at: number;
  updated_at: string;
}

function getLocalReservationsFile(): string {
  const candidates = [
    path.join(process.cwd(), 'apps', 'web', 'cart_reservations_db.json'),
    path.join(process.cwd(), 'cart_reservations_db.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.dirname(c))) return c;
  }
  return candidates[0];
}

export function normalizeReservationSkuKey(sku?: string): string {
  return String(sku || '').trim().toUpperCase();
}

export function buildVariantAltKey(slug?: string, size?: string, color?: string): string {
  const s = String(slug || '').trim().toLowerCase();
  const sz = String(size || '').trim().toUpperCase();
  const col = String(color || '').trim().toLowerCase();
  return `${s}::${sz}::${col}`;
}

export function buildVariantSlugSizeKey(slug?: string, size?: string): string {
  const s = String(slug || '').trim().toLowerCase();
  const sz = String(size || '').trim().toUpperCase();
  return `${s}::${sz}`;
}

export function pruneExpiredReservations(
  list: CartReservationRecord[],
  now: number = Date.now()
): { active: CartReservationRecord[]; prunedCount: number } {
  const active: CartReservationRecord[] = [];
  let prunedCount = 0;

  for (const r of Array.isArray(list) ? list : []) {
    if (
      !r ||
      !r.session_id ||
      !r.expires_at ||
      Number(r.expires_at) <= now ||
      Number(r.quantity) <= 0
    ) {
      prunedCount++;
      continue;
    }
    active.push(r);
  }

  return { active, prunedCount };
}

export async function loadActiveCartReservations(): Promise<CartReservationRecord[]> {
  const now = Date.now();
  let list: CartReservationRecord[] = [];

  try {
    const { data } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', CART_RESERVATIONS_ROW_ID)
      .maybeSingle();

    if (data?.description) {
      const parsed = JSON.parse(data.description);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch (_) {}

  if (list.length === 0) {
    try {
      const file = getLocalReservationsFile();
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch (_) {}
  }

  const { active, prunedCount } = pruneExpiredReservations(list, now);
  if (prunedCount > 0) {
    await saveActiveCartReservations(active);
  }
  return active;
}

export async function saveActiveCartReservations(list: CartReservationRecord[]): Promise<void> {
  const { active } = pruneExpiredReservations(list, Date.now());
  const payload = JSON.stringify(active);

  try {
    const file = getLocalReservationsFile();
    fs.writeFileSync(file, payload, 'utf8');
  } catch (_) {}

  try {
    const { data: existing } = await supabaseServer
      .from('products')
      .select('id')
      .eq('id', CART_RESERVATIONS_ROW_ID)
      .maybeSingle();

    if (existing?.id) {
      await supabaseServer
        .from('products')
        .update({ description: payload })
        .eq('id', CART_RESERVATIONS_ROW_ID);
    } else {
      await supabaseServer.from('products').insert([
        {
          id: CART_RESERVATIONS_ROW_ID,
          title: '__CART_RESERVATIONS_STATE__',
          slug: CART_RESERVATIONS_SLUG,
          description: payload,
        },
      ]);
    }
  } catch (_) {}
}

export async function upsertSessionCartReservations(
  sessionId: string,
  items: Array<{ sku?: string; slug?: string; size?: string; color?: string; quantity?: number }>,
  explicitExpiresAt?: number
): Promise<CartReservationRecord[]> {
  const cleanSession = String(sessionId || '').trim();
  if (!cleanSession) return await loadActiveCartReservations();

  const now = Date.now();
  const maxAllowedExpiry = now + CART_HOLD_TTL_MS;
  const expiresAt =
    explicitExpiresAt && explicitExpiresAt > now && explicitExpiresAt <= maxAllowedExpiry
      ? explicitExpiresAt
      : maxAllowedExpiry;

  const existing = await loadActiveCartReservations();
  const othersOnly = existing.filter((r) => r.session_id !== cleanSession);

  const nextForSession: CartReservationRecord[] = [];
  for (const it of Array.isArray(items) ? items : []) {
    const qty = Math.max(0, Math.floor(Number(it?.quantity) || 0));
    if (qty <= 0) continue;
    const skuKey = normalizeReservationSkuKey(it?.sku);
    const altKey = buildVariantAltKey(it?.slug, it?.size, it?.color);
    const slugSizeKey = buildVariantSlugSizeKey(it?.slug, it?.size);
    const key = skuKey || altKey || slugSizeKey;
    if (!key) continue;

    nextForSession.push({
      session_id: cleanSession,
      key,
      alt_key: altKey || slugSizeKey,
      sku: skuKey,
      slug: String(it?.slug || '').trim().toLowerCase(),
      size: String(it?.size || '').trim().toUpperCase(),
      color: String(it?.color || '').trim().toLowerCase(),
      quantity: qty,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
  }

  const merged = [...othersOnly, ...nextForSession];
  await saveActiveCartReservations(merged);
  return merged;
}

export async function clearSessionCartReservations(sessionId: string): Promise<void> {
  const cleanSession = String(sessionId || '').trim();
  if (!cleanSession) return;
  const existing = await loadActiveCartReservations();
  const remaining = existing.filter((r) => r.session_id !== cleanSession);
  if (remaining.length !== existing.length) {
    await saveActiveCartReservations(remaining);
  }
}

export function summarizeOtherSessionHolds(
  reservations: CartReservationRecord[],
  excludeSessionId?: string | null
): { byKey: Record<string, number>; nearestExpiry: Record<string, number> } {
  const now = Date.now();
  const byKey: Record<string, number> = {};
  const nearestExpiry: Record<string, number> = {};
  const excluded = String(excludeSessionId || '').trim();

  for (const r of reservations) {
    if (!r || Number(r.expires_at) <= now || r.quantity <= 0) continue;
    if (excluded && r.session_id === excluded) continue;

    const keysToCredit = new Set<string>();
    if (r.sku) keysToCredit.add(`SKU:${r.sku}`);
    if (r.slug && r.size) keysToCredit.add(`SS:${r.slug}::${r.size}`);
    if (r.slug && r.size && r.color) keysToCredit.add(`SSC:${r.slug}::${r.size}::${r.color}`);

    for (const k of Array.from(keysToCredit)) {
      byKey[k] = (byKey[k] || 0) + Number(r.quantity || 1);
      if (!nearestExpiry[k] || Number(r.expires_at) < nearestExpiry[k]) {
        nearestExpiry[k] = Number(r.expires_at);
      }
    }
  }

  return { byKey, nearestExpiry };
}
