import fs from 'fs';
import path from 'path';

export interface ConditionalItem {
  sku: string;
  title: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  image?: string;
  // Quantidades apuradas no acerto/fechamento
  kept_quantity?: number;
  returned_quantity?: number;
}

export interface ConditionalRecord {
  id: string;
  conditional_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  seller_name: string;
  dispatch_date: string; // YYYY-MM-DD ou ISO
  expected_return_date: string; // YYYY-MM-DD
  notes?: string;
  status: 'OPEN' | 'SETTLED' | 'RETURNED' | 'CANCELLED';
  items: ConditionalItem[];
  total_items: number;
  total_value: number;
  // Dados do acerto
  settled_at?: string;
  settled_sale_order_id?: string;
  settled_total_paid?: number;
  settled_payment_method?: string;
  settlement_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ConditionalsSummary {
  totalConditionals: number;
  openCount: number;
  openPiecesCount: number;
  openTotalValue: number;
  overdueCount: number;
  settledCount: number;
  returnedCount: number;
}

const CONDITIONALS_FILE = path.join(process.cwd(), 'conditionals_db.json');

// Dados iniciais de demonstração para já nascer com exemplos ricos e reais da Ana Fitness Wear
const INITIAL_DEMO_CONDITIONALS: ConditionalRecord[] = [
  {
    id: 'cond-1001',
    conditional_number: 'COND-1042',
    customer_name: 'Camila Fernandes',
    customer_phone: '9785550192',
    customer_address: 'Central St, Leominster, MA',
    seller_name: 'Beatriz Figueredo',
    dispatch_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expected_return_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Mala rosa entregue no trabalho dela. Provar com amigas.',
    status: 'OPEN',
    total_items: 4,
    total_value: 179.60,
    items: [
      {
        sku: 'TOP-CIR-P',
        title: 'TOP CIRRÊ GLOSS',
        size: 'M',
        color: 'Preto Ônix',
        quantity: 1,
        unit_price: 39.90,
        cost_price: 14.00,
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
      },
      {
        sku: 'LEG-MON-M',
        title: 'MONIQUE FLARE PANTS SET',
        size: 'M',
        color: 'Champagne Gold',
        quantity: 1,
        unit_price: 49.90,
        cost_price: 19.00,
        image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
      },
      {
        sku: 'MAC-BEA-M',
        title: 'MACACÃO FITNESS SUPLEX',
        size: 'M',
        color: 'Azul Marinho',
        quantity: 1,
        unit_price: 49.90,
        cost_price: 18.00,
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
      },
      {
        sku: 'REG-FIT-M',
        title: 'REGATÃO DRY FIT CAVADO',
        size: 'M',
        color: 'Café',
        quantity: 1,
        unit_price: 39.90,
        cost_price: 12.00,
        image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
      },
    ],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cond-1002',
    conditional_number: 'COND-1043',
    customer_name: 'Juliana Paiva',
    customer_phone: '5085558234',
    customer_address: 'Fitchburg, MA',
    seller_name: 'Ana Karina',
    dispatch_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expected_return_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Levou para experimentar antes da viagem de fim de semana.',
    status: 'OPEN',
    total_items: 3,
    total_value: 139.70,
    items: [
      {
        sku: 'KEL-BLK-L',
        title: 'KELY PANTS SET',
        size: 'L',
        color: 'Preto Ônix',
        quantity: 1,
        unit_price: 49.90,
        cost_price: 16.00,
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
      },
      {
        sku: 'SHORT-ANA-L',
        title: 'SHORTS ANATÔMICO DUPLO',
        size: 'L',
        color: 'Vinho Bordô',
        quantity: 1,
        unit_price: 44.90,
        cost_price: 15.00,
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
      },
      {
        sku: 'TOP-CRO-L',
        title: 'TOP CROPPED COSTA NUA',
        size: 'L',
        color: 'Preto',
        quantity: 1,
        unit_price: 44.90,
        cost_price: 14.00,
        image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
      },
    ],
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function readConditionals(): ConditionalRecord[] {
  try {
    if (fs.existsSync(CONDITIONALS_FILE)) {
      const raw = fs.readFileSync(CONDITIONALS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao ler conditionals_db.json:', err);
  }

  // Se o arquivo ainda não existir, cria com os dados de exemplo
  try {
    saveConditionals(INITIAL_DEMO_CONDITIONALS);
  } catch (_) {}

  return INITIAL_DEMO_CONDITIONALS;
}

export function saveConditionals(records: ConditionalRecord[]): void {
  try {
    fs.writeFileSync(CONDITIONALS_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar conditionals_db.json:', err);
  }
}

export function computeConditionalsSummary(conditionals: ConditionalRecord[]): ConditionalsSummary {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

  let openCount = 0;
  let openPiecesCount = 0;
  let openTotalValue = 0;
  let overdueCount = 0;
  let settledCount = 0;
  let returnedCount = 0;

  conditionals.forEach((c) => {
    if (c.status === 'OPEN') {
      openCount++;
      openPiecesCount += Number(c.total_items) || 0;
      openTotalValue += Number(c.total_value) || 0;

      // Verifica se está atrasada (data prevista menor que hoje)
      if (c.expected_return_date && c.expected_return_date < todayStr) {
        overdueCount++;
      }
    } else if (c.status === 'SETTLED') {
      settledCount++;
    } else if (c.status === 'RETURNED') {
      returnedCount++;
    }
  });

  return {
    totalConditionals: conditionals.length,
    openCount,
    openPiecesCount,
    openTotalValue: Number(openTotalValue.toFixed(2)),
    overdueCount,
    settledCount,
    returnedCount,
  };
}
