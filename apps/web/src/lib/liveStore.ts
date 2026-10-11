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

const LIVE_STORE_FILE = path.join(process.cwd(), 'live_store_db.json');

// Visitantes e eventos em tempo real iniciam vazios (apenas conexões e pedidos 100% reais)
const INITIAL_DEMO_VISITORS: Record<string, LiveVisitor> = {};
const INITIAL_DEMO_EVENTS: LiveEvent[] = [];

function readStore(): LiveStoreData {
  try {
    if (fs.existsSync(LIVE_STORE_FILE)) {
      const raw = fs.readFileSync(LIVE_STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.visitors === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler live_store_db.json:', e);
  }
  return {
    visitors: {},
    events: [],
  };
}

function writeStore(data: LiveStoreData) {
  try {
    fs.writeFileSync(LIVE_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('Erro ao salvar live_store_db.json:', e);
  }
}

export function recordHeartbeat(visitor: Partial<LiveVisitor> & { id: string }): { isNew: boolean; event?: LiveEvent } {
  const store = readStore();
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
    device: visitor.device || existing?.device || 'Celular',
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
    store.events = [newEvent, ...store.events.slice(0, 49)];
  }

  writeStore(store);
  return { isNew, event: newEvent };
}

export function recordLiveEvent(event: {
  type: 'NEW_VISITOR' | 'NEW_ORDER' | 'CART_VIEW';
  title: string;
  description: string;
  city: string;
  amount?: number;
  orderId?: string;
}): LiveEvent {
  const store = readStore();
  const now = Date.now();
  const newEvt: LiveEvent = {
    id: `evt-${now}-${Math.random().toString(36).substring(2, 6)}`,
    ...event,
    timestamp: now,
  };
  store.events = [newEvt, ...store.events.slice(0, 49)];
  writeStore(store);
  return newEvt;
}

export function recordOrderEvent(order: {
  orderId: string;
  customerName: string;
  city?: string;
  amount: number;
  itemsSummary?: string;
}): LiveEvent {
  const store = readStore();
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

  store.events = [orderEvent, ...store.events.slice(0, 49)];
  writeStore(store);
  return orderEvent;
}

export function getLiveFeed(cutoffSeconds: number = 180) {
  const store = readStore();
  const now = Date.now();
  const cutoffTime = now - (cutoffSeconds * 1000);

  // Filtra visitantes que enviaram ping nos últimos X segundos
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
    recentEvents: store.events.slice(0, 20),
    serverTime: now,
  };
}
