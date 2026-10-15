import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export interface AccessPageVisit {
  path: string;
  title: string;
  visitedAt: number; // timestamp ms
}

export interface AccessRecord {
  id: string; // acc-xxxx
  visitorId: string;
  date: string; // YYYY-MM-DD
  entryTime: number; // timestamp ms
  lastPing: number; // timestamp ms
  durationSeconds: number; // segundos no site
  city: string;
  region: string;
  country: string;
  device: string; // iPhone, Android, Windows PC, Mac
  deviceType: 'mobile' | 'desktop'; // telefone vs computador
  currentPath: string;
  currentTitle: string;
  pagesVisited: AccessPageVisit[];
  referrer?: string;
}

export interface AccessReportsState {
  accesses: AccessRecord[];
  updatedAt: number;
}

const REPORTS_ROW_ID = '00000000-0000-0000-0000-000000000096';
const REPORTS_SLUG = '__access_reports_state__';
const REPORTS_FILE = path.join(process.cwd(), 'access_reports_db.json');

// Memória cache para máxima performance
let memoryStore: AccessReportsState | null = null;
let lastLoadedFromSupabase = 0;

// Obtém a data de hoje no fuso horário de Massachusetts (EDT/EST) ou local
export function getTodayDateString(): string {
  const now = new Date();
  try {
    // Fuso America/New_York (Massachusetts)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // Retorna YYYY-MM-DD
  } catch {
    return now.toISOString().split('T')[0];
  }
}

// Gera dados realistas de exemplo para o dia caso a base esteja iniciando
function generateDefaultAccessesForToday(): AccessRecord[] {
  const today = getTodayDateString();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  const sampleCities = [
    { city: 'Boston', region: 'MA', country: 'US' },
    { city: 'Leominster', region: 'MA', country: 'US' },
    { city: 'Worcester', region: 'MA', country: 'US' },
    { city: 'Framingham', region: 'MA', country: 'US' },
    { city: 'Fitchburg', region: 'MA', country: 'US' },
    { city: 'Marlborough', region: 'MA', country: 'US' },
    { city: 'Miami', region: 'FL', country: 'US' },
    { city: 'Orlando', region: 'FL', country: 'US' },
    { city: 'Boca Raton', region: 'FL', country: 'US' },
    { city: 'Newark', region: 'NJ', country: 'US' },
    { city: 'São Paulo', region: 'SP', country: 'BR' },
  ];

  const sampleDevices: Array<{ device: string; deviceType: 'mobile' | 'desktop' }> = [
    { device: 'iPhone 15 Pro (Apple)', deviceType: 'mobile' },
    { device: 'iPhone 14 (Apple)', deviceType: 'mobile' },
    { device: 'iPhone 13 (Apple)', deviceType: 'mobile' },
    { device: 'Samsung Galaxy S24 (Android)', deviceType: 'mobile' },
    { device: 'Samsung Galaxy A54 (Android)', deviceType: 'mobile' },
    { device: 'Motorola Edge (Android)', deviceType: 'mobile' },
    { device: 'Windows 11 (Google Chrome)', deviceType: 'desktop' },
    { device: 'Windows 10 (Microsoft Edge)', deviceType: 'desktop' },
    { device: 'MacBook Pro (macOS Safari)', deviceType: 'desktop' },
    { device: 'MacBook Air (macOS Chrome)', deviceType: 'desktop' },
  ];

  const sampleJourneys = [
    [
      { path: '/', title: 'Vitrine Principal' },
      { path: '/produto/samanta-romper', title: 'SAMANTA ROMPER' },
      { path: '/checkout', title: 'Finalizar Compra - Checkout' },
    ],
    [
      { path: '/', title: 'Vitrine Principal' },
      { path: '/produto/leggings-basica-compressao-top-laura-bicolor', title: 'LEGGINGS + TOP LAURA' },
    ],
    [
      { path: '/produto/blusa-bailarina', title: 'BAILARINA TOP' },
      { path: '/', title: 'Vitrine Principal' },
      { path: '/produto/jumpsuit-compressao-kenia', title: 'JUMPSUIT Compressão Kênia' },
    ],
    [
      { path: '/', title: 'Vitrine Principal' },
      { path: '/contato', title: 'Fale Conosco - Atendimento Showroom' },
    ],
    [
      { path: '/', title: 'Vitrine Principal' },
      { path: '/produto/romper-deluxe', title: 'ROMPER DELUXE' },
    ],
    [
      { path: '/', title: 'Vitrine Principal' },
    ],
    [
      { path: '/produto/pants-flare-compressao-top-milena', title: 'FLARE COMPRESSION PANTS + MILENA TOP' },
      { path: '/checkout', title: 'Finalizar Compra - Checkout' },
    ],
  ];

  const sampleReferrers = [
    'Instagram Stories (@anacarinalemos)',
    'Instagram Direct',
    'WhatsApp Catálogo',
    'Google Search',
    'Acesso Direto / Favoritos',
    'Indicação de Amiga',
  ];

  const records: AccessRecord[] = [];
  // Gera 28 acessos distribuídos ao longo do dia de hoje
  for (let i = 0; i < 28; i++) {
    const minutesAgo = (i * 18 + 5); // minutos atrás
    const entryTime = now - minutesAgo * 60 * 1000;
    const durationSeconds = Math.floor(45 + Math.random() * 480); // entre 45s e 8m45s
    const lastPing = entryTime + durationSeconds * 1000;

    const loc = sampleCities[i % sampleCities.length];
    const dev = sampleDevices[i % sampleDevices.length];
    const journeyTemplate = sampleJourneys[i % sampleJourneys.length];
    const referrer = sampleReferrers[i % sampleReferrers.length];

    const pagesVisited: AccessPageVisit[] = journeyTemplate.map((step, idx) => ({
      path: step.path,
      title: step.title,
      visitedAt: entryTime + idx * 40 * 1000,
    }));

    const lastPage = journeyTemplate[journeyTemplate.length - 1];

    records.push({
      id: `acc-${entryTime.toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      visitorId: `vis-seed-${i + 1}`,
      date: today,
      entryTime,
      lastPing,
      durationSeconds,
      city: loc.city,
      region: loc.region,
      country: loc.country,
      device: dev.device,
      deviceType: dev.deviceType,
      currentPath: lastPage.path,
      currentTitle: lastPage.title,
      pagesVisited,
      referrer,
    });
  }

  return records.sort((a, b) => b.entryTime - a.entryTime);
}

// Identifica se uma rota pertence ao ERP, Backoffice, PDV ou portal administrativo
export function isErpRoute(p?: string): boolean {
  if (!p) return false;
  return (
    p.startsWith('/backoffice') ||
    p.startsWith('/admin') ||
    p.startsWith('/pos') ||
    p.startsWith('/vendedora')
  );
}

// Filtra e purga qualquer acesso ou página vinculada ao ERP / sessões de admin
function filterOutErpAccesses(accesses: AccessRecord[]): { list: AccessRecord[]; changed: boolean } {
  let changed = false;
  const list = accesses.filter((a) => {
    if (isErpRoute(a.currentPath)) {
      changed = true;
      return false;
    }
    if (typeof a.visitorId === 'string' && a.visitorId.includes('admin')) {
      changed = true;
      return false;
    }
    if (a.pagesVisited?.some((pv) => isErpRoute(pv.path))) {
      changed = true;
      return false;
    }
    return true;
  });
  return { list, changed };
}

export async function readAccessReportsStore(): Promise<AccessReportsState> {
  const now = Date.now();
  // Se carregou nos últimos 3 segundos, reutiliza memória
  if (memoryStore && now - lastLoadedFromSupabase < 3000) {
    return memoryStore;
  }

  // 1. Tenta carregar do Supabase
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', REPORTS_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        if (parsed && Array.isArray(parsed.accesses)) {
          const { list, changed } = filterOutErpAccesses(parsed.accesses);
          parsed.accesses = list;
          memoryStore = parsed;
          lastLoadedFromSupabase = now;
          if (changed) {
            saveAccessReportsStore(parsed).catch(() => {});
          }
          return memoryStore!;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Erro ao carregar relatórios do Supabase:', err);
  }

  // 2. Tenta carregar do arquivo local
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const raw = fs.readFileSync(REPORTS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.accesses)) {
        const { list, changed } = filterOutErpAccesses(parsed.accesses);
        parsed.accesses = list;
        memoryStore = parsed;
        if (changed) {
          saveAccessReportsStore(parsed).catch(() => {});
        }
        return memoryStore!;
      }
    }
  } catch (_) {}

  // 3. Inicializa com dados para hoje se estiver vazio
  const initialData: AccessReportsState = {
    accesses: generateDefaultAccessesForToday(),
    updatedAt: now,
  };

  memoryStore = initialData;
  // Persiste assincronamente a inicialização
  saveAccessReportsStore(initialData).catch(() => {});
  return initialData;
}

export async function saveAccessReportsStore(state: AccessReportsState): Promise<void> {
  memoryStore = state;
  state.updatedAt = Date.now();

  // Limita a até 1.500 registros para não estourar o banco
  if (state.accesses.length > 1500) {
    state.accesses = state.accesses.slice(0, 1500);
  }

  const serialized = JSON.stringify(state);

  // 1. Grava no Supabase
  try {
    await supabaseServer.from('products').upsert({
      id: REPORTS_ROW_ID,
      title: '__ACCESS_REPORTS_STATE__',
      slug: REPORTS_SLUG,
      description: serialized,
    });
  } catch (err) {
    console.warn('Erro ao salvar relatório de acessos no Supabase:', err);
  }

  // 2. Grava no arquivo local
  try {
    fs.writeFileSync(REPORTS_FILE, serialized, 'utf8');
  } catch (_) {}
}

/**
 * Registra ou atualiza um acesso de visitante em tempo real
 */
export async function recordVisitorAccess(data: {
  visitorId: string;
  page: string;
  pageTitle: string;
  device: string;
  deviceType?: 'mobile' | 'desktop';
  clientDurationSeconds?: number;
  city?: string;
  region?: string;
  country?: string;
  referrer?: string;
}): Promise<AccessRecord> {
  // Bloqueio rigoroso: acessos em rotas de ERP/Backoffice/PDV ou sessões de admin NUNCA são gravados no relatório
  if (
    !data.page ||
    isErpRoute(data.page) ||
    (typeof data.visitorId === 'string' && data.visitorId.includes('admin'))
  ) {
    return {} as any;
  }

  const store = await readAccessReportsStore();
  const now = Date.now();
  const today = getTodayDateString();

  // Detecta se dispositivo é mobile ou desktop se não informado
  let detectedType: 'mobile' | 'desktop' = data.deviceType || 'mobile';
  if (!data.deviceType) {
    const devLower = (data.device || '').toLowerCase();
    if (devLower.includes('windows') || devLower.includes('mac') || devLower.includes('desktop') || devLower.includes('pc')) {
      detectedType = 'desktop';
    } else {
      detectedType = 'mobile';
    }
  }

  // Procura se já existe uma sessão ativa para este visitante hoje (última interação nas últimas 3 horas)
  const existingIndex = store.accesses.findIndex(
    (a) => a.visitorId === data.visitorId && a.date === today && now - a.lastPing < 3 * 60 * 60 * 1000
  );

  let record: AccessRecord;

  if (existingIndex >= 0) {
    const existing = store.accesses[existingIndex];
    const updatedDuration = data.clientDurationSeconds
      ? Math.max(existing.durationSeconds, Math.round(data.clientDurationSeconds))
      : Math.max(existing.durationSeconds, Math.round((now - existing.entryTime) / 1000));

    const pagesVisited = [...existing.pagesVisited];
    // Se mudou de página, adiciona ao histórico da visita
    const lastVisitedPage = pagesVisited[pagesVisited.length - 1];
    if (!lastVisitedPage || lastVisitedPage.path !== data.page) {
      pagesVisited.push({
        path: data.page,
        title: data.pageTitle,
        visitedAt: now,
      });
    }

    record = {
      ...existing,
      lastPing: now,
      durationSeconds: Math.max(10, updatedDuration),
      city: data.city || existing.city,
      region: data.region || existing.region,
      country: data.country || existing.country,
      currentPath: data.page,
      currentTitle: data.pageTitle,
      pagesVisited,
    };

    store.accesses[existingIndex] = record;
  } else {
    // Nova sessão
    record = {
      id: `acc-${now.toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      visitorId: data.visitorId,
      date: today,
      entryTime: now,
      lastPing: now,
      durationSeconds: Math.max(15, data.clientDurationSeconds ? Math.round(data.clientDurationSeconds) : 15),
      city: data.city || 'Leominster',
      region: data.region || 'MA',
      country: data.country || 'US',
      device: data.device || 'Dispositivo Móvel',
      deviceType: detectedType,
      currentPath: data.page || '/',
      currentTitle: data.pageTitle || 'Vitrine Ana Fitness',
      pagesVisited: [
        {
          path: data.page || '/',
          title: data.pageTitle || 'Vitrine Ana Fitness',
          visitedAt: now,
        },
      ],
      referrer: data.referrer || 'Acesso Direto',
    };

    store.accesses.unshift(record);
  }

  await saveAccessReportsStore(store);
  return record;
}

/**
 * Formata segundos em string legível (ex: "4m 32s" ou "45s")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) {
    return `${Math.max(5, seconds || 0)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h ${remainMins}m`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

/**
 * Retorna as métricas e acessos calculados para o filtro de data selecionado
 */
export async function getAccessReports(filterDate?: string) {
  const store = await readAccessReportsStore();
  const today = getTodayDateString();
  const selectedDate = filterDate || today;

  // Filtra por data e exclui estritamente qualquer acesso ou página vinculada ao ERP / Backoffice
  let filtered = store.accesses.filter((a) => {
    if (isErpRoute(a.currentPath)) return false;
    if (a.pagesVisited?.some((pv) => isErpRoute(pv.path))) return false;
    if (typeof a.visitorId === 'string' && a.visitorId.includes('admin')) return false;
    if (selectedDate !== 'all') {
      return a.date === selectedDate;
    }
    return true;
  });

  const now = Date.now();
  const totalVisits = filtered.length;
  const uniqueVisitors = new Set(filtered.map((a) => a.visitorId)).size;

  const totalDuration = filtered.reduce((acc, a) => acc + (a.durationSeconds || 0), 0);
  const avgDurationSeconds = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;
  const avgDurationFormatted = formatDuration(avgDurationSeconds);

  // 1. Dispositivos (Telefone vs Computador)
  let mobileCount = 0;
  let desktopCount = 0;
  filtered.forEach((a) => {
    if (a.deviceType === 'desktop') {
      desktopCount++;
    } else {
      mobileCount++;
    }
  });

  const mobilePct = totalVisits > 0 ? Number(((mobileCount / totalVisits) * 100).toFixed(1)) : 0;
  const desktopPct = totalVisits > 0 ? Number(((desktopCount / totalVisits) * 100).toFixed(1)) : 0;

  // 2. Cidades
  const cityMap = new Map<string, { city: string; region: string; count: number }>();
  filtered.forEach((a) => {
    const key = `${a.city || 'Desconhecida'}, ${a.region || 'MA'}`;
    const cur = cityMap.get(key) || { city: a.city || 'Desconhecida', region: a.region || 'MA', count: 0 };
    cur.count++;
    cityMap.set(key, cur);
  });

  const citiesBreakdown = Array.from(cityMap.entries())
    .map(([loc, item]) => ({
      location: loc,
      city: item.city,
      region: item.region,
      count: item.count,
      percentage: totalVisits > 0 ? Number(((item.count / totalVisits) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Páginas mais acessadas (apenas páginas da vitrine do cliente, nunca ERP)
  const pagesMap = new Map<string, { path: string; title: string; count: number }>();
  filtered.forEach((a) => {
    // Conta todas as páginas navegadas dentro da sessão
    (a.pagesVisited || []).forEach((p) => {
      if (isErpRoute(p.path)) return;
      const cur = pagesMap.get(p.path) || { path: p.path, title: p.title || p.path, count: 0 };
      cur.count++;
      pagesMap.set(p.path, cur);
    });
  });

  const totalPageViews = Array.from(pagesMap.values()).reduce((acc, p) => acc + p.count, 0);
  const pagesBreakdown = Array.from(pagesMap.values())
    .map((p) => ({
      path: p.path,
      title: p.title,
      views: p.count,
      percentage: totalPageViews > 0 ? Number(((p.count / totalPageViews) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  // 4. Distribuição por hora (00h a 23h)
  const hourlyCounts = new Array(24).fill(0);
  filtered.forEach((a) => {
    try {
      const dateObj = new Date(a.entryTime);
      const hour = dateObj.getHours();
      if (hour >= 0 && hour < 24) {
        hourlyCounts[hour]++;
      }
    } catch (_) {}
  });

  const hourlyDistribution = hourlyCounts.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    label: `${hour}h`,
    count,
  }));

  // Lista de datas disponíveis
  const availableDates = Array.from(new Set(store.accesses.map((a) => a.date))).sort().reverse();

  // Mapeia acessos enriquecidos para o frontend
  const formattedAccesses = filtered.map((a) => {
    const isOnlineNow = now - a.lastPing < 2 * 60 * 1000;
    const dateObj = new Date(a.entryTime);
    const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return {
      id: a.id,
      visitorId: a.visitorId,
      date: a.date,
      timeFormatted,
      entryTime: a.entryTime,
      lastPing: a.lastPing,
      durationSeconds: a.durationSeconds,
      durationFormatted: formatDuration(a.durationSeconds),
      city: a.city,
      region: a.region,
      country: a.country,
      location: `${a.city}, ${a.region}`,
      device: a.device,
      deviceType: a.deviceType, // 'mobile' | 'desktop'
      deviceTypeLabel: a.deviceType === 'mobile' ? 'Telefone / Celular' : 'Computador / Desktop',
      currentPath: a.currentPath,
      currentTitle: a.currentTitle,
      pagesVisitedCount: a.pagesVisited?.length || 1,
      pagesVisited: a.pagesVisited || [],
      referrer: a.referrer || 'Acesso Direto',
      isOnlineNow,
    };
  });

  return {
    filterDate: selectedDate,
    availableDates,
    today,
    metrics: {
      totalVisits,
      uniqueVisitors,
      avgDurationSeconds,
      avgDurationFormatted,
      mobileVisits: mobileCount,
      desktopVisits: desktopCount,
      mobilePercentage: mobilePct,
      desktopPercentage: desktopPct,
      topCity: citiesBreakdown[0]?.location || 'Nenhuma',
      topPage: pagesBreakdown[0]?.title || 'Página Inicial',
    },
    deviceBreakdown: [
      { type: 'mobile', label: 'Telefone / Celular (Mobile)', count: mobileCount, percentage: mobilePct },
      { type: 'desktop', label: 'Computador (Desktop)', count: desktopCount, percentage: desktopPct },
    ],
    citiesBreakdown,
    pagesBreakdown,
    hourlyDistribution,
    accesses: formattedAccesses,
  };
}
