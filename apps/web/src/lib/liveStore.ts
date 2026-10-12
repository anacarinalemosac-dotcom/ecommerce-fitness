import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export interface LiveVisitor {
  id: string;
  city: string;
  region: string;
  country: string;
  page: string;
  pageTitle: string;
  device: string;
  lastPing: number;
  firstSeen: number;
}

export interface LiveEvent {
  id: string;
  type: 'NEW_VISITOR' | 'NEW_ORDER' | 'CART_VIEW';
  title: string;
  description: string;
  city: string;
  amount?: number;
  orderId?: string;
  timestamp: number;
}

interface LiveStoreData {
  visitors: Record<string, LiveVisitor>;
  events: LiveEvent[];
}

const RADAR_PRODUCT_ID = '00000000-0000-0000-0000-000000000099';
const RADAR_SLUG = '__live_radar_state__';
const LIVE_STORE_FILE = path.join(process.cwd(), 'live_store_db.json');

// Cache em memória para aceleração entre requisições
let memoryStore: LiveStoreData = {
  visitors: {},
  events: [],
};
let lastLoadedFromSupabase = 0;

async function readStore(): Promise<LiveStoreData> {
  const now = Date.now();
  // Se carregou nos últimos 2 segundos, reutiliza memória para otimizar latência
  if (now - lastLoadedFromSupabase < 2000 && Object.keys(memoryStore.visitors).length > 0) {
    return memoryStore;
  }

  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', RADAR_PRODUCT_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        if (parsed && typeof parsed.visitors === 'object') {
          memoryStore = {
            visitors: parsed.visitors || {},
            events: Array.isArray(parsed.events) ? parsed.events : [],
          };
          lastLoadedFromSupabase = now;
          return memoryStore;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Erro ao ler radar do Supabase:', err);
  }

  // Fallback para arquivo local se existir
  try {
    if (fs.existsSync(LIVE_STORE_FILE)) {
      const raw = fs.readFileSync(LIVE_STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.visitors === 'object') {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (_) {}

  return memoryStore;
}

async function writeStore(data: LiveStoreData): Promise<void> {
  memoryStore = data;
  lastLoadedFromSupabase = Date.now();

  // Pruna visitantes inativos há mais de 20 minutos para manter o JSON compacto
  const now = Date.now();
  const prunedVisitors: Record<string, LiveVisitor> = {};
  Object.values(data.visitors).forEach((v) => {
    if (now - v.lastPing < 20 * 60 * 1000) {
      prunedVisitors[v.id] = v;
    }
  });
  data.visitors = prunedVisitors;
  data.events = (data.events || []).slice(0, 40);

  const serialized = JSON.stringify(data);

  // 1. Grava no Supabase (sincronização na nuvem em tempo real para Vercel)
  try {
    await supabaseServer.from('products').upsert({
      id: RADAR_PRODUCT_ID,
      title: '__LIVE_RADAR_STORE__',
      slug: RADAR_SLUG,
      description: serialized,
    });
  } catch (err) {
    console.warn('Erro ao salvar radar no Supabase:', err);
  }

  // 2. Grava no arquivo local (quando permitido pelo ambiente)
  try {
    fs.writeFileSync(LIVE_STORE_FILE, serialized, 'utf8');
  } catch (_) {}
}

export async function recordHeartbeat(visitor: Partial<LiveVisitor> & { id: string }): Promise<{ isNew: boolean; event?: LiveEvent }> {
  const store = await readStore();
  const now = Date.now();
  const existing = store.visitors[visitor.id];
  const isNew = !existing || (now - existing.lastPing > 1000 * 60 * 15); // Novo se ausente por mais de 15 min

  const fullVisitor: LiveVisitor = {
    id: visitor.id,
    city: visitor.city || existing?.city || 'Leominster',
    region: visitor.region || existing?.region || 'MA',
    country: visitor.country || existing?.country || 'US',
    page: visitor.page || existing?.page || '/',
    pageTitle: visitor.pageTitle || existing?.pageTitle || 'Vitrine Ana Fitness',
    device: visitor.device || existing?.device || 'Dispositivo Móvel',
    lastPing: now,
    firstSeen: isNew ? now : (existing?.firstSeen || now),
  };

  store.visitors[visitor.id] = fullVisitor;

  let newEvent: LiveEvent | undefined;
  if (isNew) {
    newEvent = {
      id: `evt-${now}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'NEW_VISITOR',
      title: 'Cliente Online no Site!',
      description: `Novo visitante de ${fullVisitor.city}, ${fullVisitor.region} vendo ${fullVisitor.pageTitle}`,
      city: `${fullVisitor.city}, ${fullVisitor.region}`,
      timestamp: now,
    };
    store.events = [newEvent, ...(store.events || []).slice(0, 39)];
  }

  await writeStore(store);
  return { isNew, event: newEvent };
}

export async function recordLiveEvent(event: {
  type: 'NEW_VISITOR' | 'NEW_ORDER' | 'CART_VIEW';
  title: string;
  description: string;
  city: string;
  amount?: number;
  orderId?: string;
}): Promise<LiveEvent> {
  const store = await readStore();
  const now = Date.now();
  const newEvt: LiveEvent = {
    id: `evt-${now}-${Math.random().toString(36).substring(2, 6)}`,
    ...event,
    timestamp: now,
  };
  store.events = [newEvt, ...(store.events || []).slice(0, 39)];
  await writeStore(store);
  return newEvt;
}

export async function recordOrderEvent(order: {
  orderId: string;
  customerName: string;
  city?: string;
  amount: number;
  itemsSummary?: string;
}): Promise<LiveEvent> {
  const store = await readStore();
  const now = Date.now();
  const city = order.city || 'Leominster, MA';

  const orderEvent: LiveEvent = {
    id: `evt-order-${now}`,
    type: 'NEW_ORDER',
    title: 'NOVA VENDA REALIZADA!',
    description: `${order.customerName} comprou $${order.amount.toFixed(2)}${order.itemsSummary ? ` (${order.itemsSummary})` : ''}`,
    city,
    amount: order.amount,
    orderId: order.orderId,
    timestamp: now,
  };

  store.events = [orderEvent, ...(store.events || []).slice(0, 39)];
  await writeStore(store);
  return orderEvent;
}

export async function getLiveFeed(cutoffSeconds: number = 300) {
  const store = await readStore();
  const now = Date.now();
  const cutoffTime = now - (cutoffSeconds * 1000);

  // Filtra visitantes que enviaram ping nos últimos X segundos (padrão 5 minutos = 300s)
  const activeVisitors = Object.values(store.visitors).filter((v) => v.lastPing >= cutoffTime);

  // Agrupa cidades únicas
  const citiesMap = new Map<string, number>();
  activeVisitors.forEach((v) => {
    const loc = `${v.city}, ${v.region}`;
    citiesMap.set(loc, (citiesMap.get(loc) || 0) + 1);
  });

  const topCities = Array.from(citiesMap.entries()).map(([city, count]) => ({ city, count }));

  return {
    activeCount: activeVisitors.length,
    activeVisitors: activeVisitors.sort((a, b) => b.lastPing - a.lastPing),
    topCities,
    recentEvents: (store.events || []).slice(0, 20),
    serverTime: now,
  };
}
