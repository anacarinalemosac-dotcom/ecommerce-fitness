import fs from 'fs';
import path from 'path';
import { supabaseServer } from '@/lib/supabaseServer';

export interface TrackedCartItem {
  id?: string;
  title: string;
  slug?: string;
  size: string;
  color: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface TrackedCartSession {
  sessionId: string;
  visitorId?: string;
  items: TrackedCartItem[];
  subtotal: number;
  itemCount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  city?: string;
  region?: string;
  device?: string;
  firstAddedAt: number;
  lastUpdatedAt: number;
  completedAt?: number | null;
  status: 'ACTIVE' | 'ABANDONED' | 'COMPLETED';
}

export interface CartTrackerSummary {
  activeCount: number;
  abandonedCount: number;
  activeCarts: TrackedCartSession[];
  abandonedCarts: TrackedCartSession[];
  totalActiveValue: number;
  totalAbandonedValue: number;
  serverTime: number;
}

const CARTS_CLOUD_OBJECT_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1dc24d48d2cfe';
const CARTS_DB_ROW_ID = '00000000-0000-0000-0000-000000000079';
const CARTS_LOCAL_FILE = path.join(process.cwd(), 'cart_sessions_db.json');

// Cache em memória
let memoryCartsStore: Record<string, TrackedCartSession> = {};
let lastLoadedTime = 0;

async function readCartsStore(): Promise<Record<string, TrackedCartSession>> {
  const now = Date.now();
  // Se carregou nos últimos 2 segundos, reutiliza memória
  if (now - lastLoadedTime < 2000 && Object.keys(memoryCartsStore).length > 0) {
    return memoryCartsStore;
  }

  // 1. Tenta carregar do Supabase (se disponível e não bloqueado por cota)
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', CARTS_DB_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        if (parsed && typeof parsed === 'object') {
          memoryCartsStore = parsed;
          lastLoadedTime = now;
          return memoryCartsStore;
        }
      } catch (_) {}
    }
  } catch (_) {}

  // 2. Camada Resiliente em Nuvem (Persistência multi-instância na Vercel)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(CARTS_CLOUD_OBJECT_URL, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json?.data?.carts && typeof json.data.carts === 'object') {
        memoryCartsStore = json.data.carts;
        lastLoadedTime = now;
        return memoryCartsStore;
      }
    }
  } catch (_) {}

  // 3. Fallback para arquivo local se existir
  try {
    if (fs.existsSync(CARTS_LOCAL_FILE)) {
      const raw = fs.readFileSync(CARTS_LOCAL_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryCartsStore = parsed;
        return memoryCartsStore;
      }
    }
  } catch (_) {}

  return memoryCartsStore;
}

async function writeCartsStore(carts: Record<string, TrackedCartSession>): Promise<void> {
  memoryCartsStore = carts;
  lastLoadedTime = Date.now();

  const now = Date.now();
  // Pruna carrinhos com mais de 48 horas ou concluídos há mais de 2 horas
  const pruned: Record<string, TrackedCartSession> = {};
  Object.values(carts).forEach((c) => {
    if (c.status === 'COMPLETED' && c.completedAt && now - c.completedAt > 2 * 60 * 60 * 1000) {
      return;
    }
    if (now - c.lastUpdatedAt < 48 * 60 * 60 * 1000) {
      pruned[c.sessionId] = c;
    }
  });

  const payload = JSON.stringify(pruned);

  // 1. Tenta salvar no Supabase
  try {
    await supabaseServer.from('products').upsert({
      id: CARTS_DB_ROW_ID,
      title: '__CARTS_TRACKER_STORE__',
      slug: '__carts_tracker_state__',
      description: payload,
    });
  } catch (_) {}

  // 2. Salva na Nuvem Resiliente (Vercel)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    await fetch(CARTS_CLOUD_OBJECT_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'ana_fitness_carts_state',
        data: { carts: pruned, updatedAt: now },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (_) {}

  // 3. Salva no arquivo local
  try {
    fs.writeFileSync(CARTS_LOCAL_FILE, payload, 'utf8');
  } catch (_) {}
}

export async function upsertTrackedCart(data: {
  sessionId: string;
  visitorId?: string;
  items: TrackedCartItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  city?: string;
  region?: string;
  device?: string;
  isCompleted?: boolean;
}): Promise<TrackedCartSession | null> {
  const sessionId = String(data.sessionId || '').trim();
  if (!sessionId) return null;

  const store = await readCartsStore();
  const now = Date.now();
  const existing = store[sessionId];

  // Se o carrinho foi esvaziado pelo cliente
  if (!data.items || data.items.length === 0) {
    if (existing) {
      delete store[sessionId];
      await writeCartsStore(store);
    }
    return null;
  }

  const items = data.items.map((it) => ({
    id: it.id,
    title: it.title || 'Peça Fitness',
    slug: it.slug || '',
    size: it.size || 'M',
    color: it.color || 'Padrão',
    sku: it.sku || '',
    price: Number(it.price) || 0,
    quantity: Math.max(1, Number(it.quantity) || 1),
    image: it.image || '',
  }));

  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = Number(
    items.reduce((acc, it) => acc + it.price * it.quantity, 0).toFixed(2)
  );

  const isCompleted = Boolean(data.isCompleted);

  const updatedSession: TrackedCartSession = {
    sessionId,
    visitorId: data.visitorId || existing?.visitorId || '',
    items,
    itemCount,
    subtotal,
    customerName: data.customerName || existing?.customerName || '',
    customerPhone: data.customerPhone || existing?.customerPhone || '',
    customerEmail: data.customerEmail || existing?.customerEmail || '',
    city: data.city || existing?.city || '',
    region: data.region || existing?.region || '',
    device: data.device || existing?.device || '',
    firstAddedAt: existing?.firstAddedAt || now,
    lastUpdatedAt: now,
    completedAt: isCompleted ? now : existing?.completedAt || null,
    status: isCompleted ? 'COMPLETED' : 'ACTIVE',
  };

  store[sessionId] = updatedSession;
  await writeCartsStore(store);
  return updatedSession;
}

export async function markCartCompleted(sessionId: string): Promise<void> {
  const cleanId = String(sessionId || '').trim();
  if (!cleanId) return;
  const store = await readCartsStore();
  if (store[cleanId]) {
    store[cleanId].status = 'COMPLETED';
    store[cleanId].completedAt = Date.now();
    await writeCartsStore(store);
  }
}

export async function getCartTrackerSummary(): Promise<CartTrackerSummary> {
  const store = await readCartsStore();
  const now = Date.now();
  const THIRTY_MINUTES_MS = 30 * 60 * 1000;

  const activeCarts: TrackedCartSession[] = [];
  const abandonedCarts: TrackedCartSession[] = [];

  Object.values(store).forEach((cart) => {
    // Ignora carrinhos que já finalizaram a compra
    if (cart.status === 'COMPLETED') return;
    if (!cart.items || cart.items.length === 0) return;

    const diff = now - cart.lastUpdatedAt;

    if (diff < THIRTY_MINUTES_MS) {
      // Menos de 30 minutos desde a última alteração: carrinho ativo sendo montado agora
      activeCarts.push({
        ...cart,
        status: 'ACTIVE',
      });
    } else {
      // 30 minutos ou mais: carrinho abandonado
      abandonedCarts.push({
        ...cart,
        status: 'ABANDONED',
      });
    }
  });

  // Ordena os ativos pelos mais recentes primeiro
  activeCarts.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  // Ordena os abandonados pelos mais recentes primeiro
  abandonedCarts.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);

  const totalActiveValue = Number(
    activeCarts.reduce((acc, c) => acc + c.subtotal, 0).toFixed(2)
  );
  const totalAbandonedValue = Number(
    abandonedCarts.reduce((acc, c) => acc + c.subtotal, 0).toFixed(2)
  );

  return {
    activeCount: activeCarts.length,
    abandonedCount: abandonedCarts.length,
    activeCarts,
    abandonedCarts,
    totalActiveValue,
    totalAbandonedValue,
    serverTime: now,
  };
}
