import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const COUPONS_ROW_ID = '00000000-0000-0000-0000-000000000094';
export const COUPONS_SLUG = '__coupons_db_state__';
export const COUPONS_FILE = path.join(process.cwd(), 'coupons_db.json');

export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';

export interface CouponRecord {
  id: string;
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number; // ex: 15 (15%), 10 ($10 OFF), 0 (Frete Grátis)
  min_order_amount?: number; // valor mínimo do pedido em USD (opcional)
  max_discount_amount?: number; // teto máximo de desconto em USD (opcional)
  max_uses?: number; // limite total de utilizações (opcional)
  times_used: number; // quantas vezes já foi utilizado
  valid_from?: string; // YYYY-MM-DD
  valid_until?: string; // YYYY-MM-DD (data de expiração)
  active: boolean; // true = ativo, false = pausado
  applies_to: 'ALL' | 'ONLINE' | 'POS';
  seller_name?: string; // nome da vendedora ou 'LOJA OFICIAL'
  created_at: string;
}

let memoryCoupons: CouponRecord[] | null = null;
let lastCouponsFetch = 0;

export const DEFAULT_SEED_COUPONS: CouponRecord[] = [
  {
    id: 'coup-bemvinda10',
    code: 'BEMVINDA10',
    description: 'Cupom de Boas-Vindas para primeira compra oficial no site',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    min_order_amount: 30,
    times_used: 18,
    active: true,
    applies_to: 'ALL',
    seller_name: 'Loja Oficial Ana Fitness Wear',
    created_at: new Date().toISOString(),
  },
  {
    id: 'coup-verao15',
    code: 'VERAO15',
    description: 'Campanha de Alto Verão Fitness • 15% OFF',
    discount_type: 'PERCENTAGE',
    discount_value: 15,
    min_order_amount: 50,
    times_used: 32,
    active: true,
    applies_to: 'ALL',
    seller_name: 'Loja Oficial Ana Fitness Wear',
    created_at: new Date().toISOString(),
  },
  {
    id: 'coup-ana10',
    code: 'ANA10',
    description: 'Cupom Oficial Exclusivo da Ana Carina',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    times_used: 47,
    active: true,
    applies_to: 'ALL',
    seller_name: 'Ana Carina (Oficial)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'coup-fretegratis',
    code: 'FRETEGRATIS',
    description: 'Frete Grátis Oficial para compras acima de $75',
    discount_type: 'FREE_SHIPPING',
    discount_value: 0,
    min_order_amount: 75,
    times_used: 14,
    active: true,
    applies_to: 'ONLINE',
    seller_name: 'Loja Oficial Ana Fitness Wear',
    created_at: new Date().toISOString(),
  },
];

export async function readCoupons(): Promise<CouponRecord[]> {
  const now = Date.now();
  if (memoryCoupons && now - lastCouponsFetch < 10000) {
    return memoryCoupons;
  }

  // 1. Tenta buscar do Supabase (Nuvem em produção)
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', COUPONS_ROW_ID)
      .maybeSingle();

    if (!error && data?.description) {
      const parsed = JSON.parse(data.description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCoupons = parsed;
        lastCouponsFetch = now;
        return memoryCoupons;
      }
    }
  } catch (err) {
    console.warn('Aviso ao ler cupons do Supabase:', err);
  }

  // 2. Tenta ler do arquivo local (fallback)
  try {
    if (fs.existsSync(COUPONS_FILE)) {
      const raw = fs.readFileSync(COUPONS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCoupons = parsed;
        lastCouponsFetch = now;
        return memoryCoupons;
      }
    }
  } catch (e) {
    console.warn('Aviso ao ler coupons_db.json:', e);
  }

  // 3. Fallback para cupons iniciais
  memoryCoupons = DEFAULT_SEED_COUPONS;
  lastCouponsFetch = now;
  // Persiste os cupons padrão inicial no Supabase em segundo plano
  writeCoupons(memoryCoupons).catch(() => {});
  return memoryCoupons;
}

export async function writeCoupons(coupons: CouponRecord[]): Promise<void> {
  memoryCoupons = coupons;
  lastCouponsFetch = Date.now();
  const serialized = JSON.stringify(coupons, null, 2);

  // 1. Salva no Supabase (Nuvem permanente)
  try {
    await supabaseServer.from('products').upsert({
      id: COUPONS_ROW_ID,
      title: '__COUPONS_DB_STATE__',
      slug: COUPONS_SLUG,
      description: serialized,
    });
  } catch (err) {
    console.warn('Erro ao salvar cupons no Supabase:', err);
  }

  // 2. Salva no arquivo local
  try {
    fs.writeFileSync(COUPONS_FILE, serialized, 'utf8');
  } catch (e) {
    console.warn('Aviso ao salvar coupons_db.json local:', e);
  }
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  coupon?: CouponRecord;
  discount_type?: DiscountType;
  discount_value?: number;
  discount_amount: number; // Valor calculado em $ USD
  free_shipping: boolean;
  seller_name?: string;
  commission_pct?: number;
  message: string;
}

/**
 * Validação centralizada de Cupons (usada no Checkout e no PDV)
 */
export async function validateCouponCode(
  rawCode: string,
  subtotal: number = 0,
  channel: 'ONLINE' | 'POS' = 'ONLINE'
): Promise<CouponValidationResult> {
  const clean = rawCode.trim().toUpperCase();
  if (!clean) {
    return {
      valid: false,
      discount_amount: 0,
      free_shipping: false,
      message: 'Código do cupom não informado.',
    };
  }

  // 1. Busca cupons da Loja Oficial
  const storeCoupons = await readCoupons();
  const matchedCoupon = storeCoupons.find(
    (c) => c.code.toUpperCase() === clean
  );

  const todayStr = new Date().toISOString().split('T')[0];

  if (matchedCoupon) {
    // Verifica se está ativo
    if (!matchedCoupon.active) {
      return {
        valid: false,
        discount_amount: 0,
        free_shipping: false,
        message: `O cupom ${clean} está pausado no momento.`,
      };
    }

    // Verifica restrição de canal
    if (
      matchedCoupon.applies_to !== 'ALL' &&
      matchedCoupon.applies_to !== channel
    ) {
      return {
        valid: false,
        discount_amount: 0,
        free_shipping: false,
        message: `O cupom ${clean} é válido exclusivamente para compras ${
          matchedCoupon.applies_to === 'ONLINE' ? 'no site' : 'no balcão/showroom'
        }.`,
      };
    }

    // Verifica data de início
    if (matchedCoupon.valid_from && matchedCoupon.valid_from > todayStr) {
      return {
        valid: false,
        discount_amount: 0,
        free_shipping: false,
        message: `O cupom ${clean} começará a valer a partir de ${matchedCoupon.valid_from}.`,
      };
    }

    // Verifica data de expiração
    if (matchedCoupon.valid_until && matchedCoupon.valid_until < todayStr) {
      return {
        valid: false,
        discount_amount: 0,
        free_shipping: false,
        message: `O cupom ${clean} expirou em ${matchedCoupon.valid_until}.`,
      };
    }

    // Verifica limite de utilizações
    if (
      matchedCoupon.max_uses &&
      matchedCoupon.times_used >= matchedCoupon.max_uses
    ) {
      return {
        valid: false,
        discount_amount: 0,
        free_shipping: false,
        message: `O cupom ${clean} atingiu o limite máximo de utilizações.`,
      };
    }

    // Verifica valor mínimo do pedido
    if (
      matchedCoupon.min_order_amount &&
      subtotal < matchedCoupon.min_order_amount
    ) {
      return {
        valid: false,
        discount_amount: 0,
        free_shipping: false,
        message: `O cupom ${clean} exige pedido mínimo de $${matchedCoupon.min_order_amount.toFixed(
          2
        )} (seu total em produtos é $${subtotal.toFixed(2)}).`,
      };
    }

    // Cálculo do Desconto
    let discountAmount = 0;
    let freeShipping = false;

    if (matchedCoupon.discount_type === 'PERCENTAGE') {
      const pct = Math.min(100, Math.max(0, matchedCoupon.discount_value));
      discountAmount = Number(((subtotal * pct) / 100).toFixed(2));
      if (
        matchedCoupon.max_discount_amount &&
        discountAmount > matchedCoupon.max_discount_amount
      ) {
        discountAmount = matchedCoupon.max_discount_amount;
      }
    } else if (matchedCoupon.discount_type === 'FIXED') {
      discountAmount = Math.min(subtotal, Math.max(0, matchedCoupon.discount_value));
    } else if (matchedCoupon.discount_type === 'FREE_SHIPPING') {
      freeShipping = true;
    }

    return {
      valid: true,
      code: matchedCoupon.code,
      coupon: matchedCoupon,
      discount_type: matchedCoupon.discount_type,
      discount_value: matchedCoupon.discount_value,
      discount_amount: discountAmount,
      free_shipping: freeShipping,
      seller_name: matchedCoupon.seller_name || 'Loja Oficial Ana Fitness Wear',
      message:
        matchedCoupon.discount_type === 'FREE_SHIPPING'
          ? `✓ CUPOM ${matchedCoupon.code} APLICADO • FRETE GRÁTIS ATIVADO!`
          : matchedCoupon.discount_type === 'PERCENTAGE'
          ? `✓ CUPOM ${matchedCoupon.code} APLICADO • ${matchedCoupon.discount_value}% DE DESCONTO (-$${discountAmount.toFixed(2)})`
          : `✓ CUPOM ${matchedCoupon.code} APLICADO • $${matchedCoupon.discount_value.toFixed(2)} OFF (-$${discountAmount.toFixed(2)})`,
    };
  }

  // 2. Se não encontrou nos cupons da Loja, verifica se é um cupom de Vendedora Afiliada
  try {
    const sellersFile = path.join(process.cwd(), 'sellers_db.json');
    let sellersList: any[] = [];
    if (fs.existsSync(sellersFile)) {
      sellersList = JSON.parse(fs.readFileSync(sellersFile, 'utf8'));
    }
    const matchedSeller = sellersList.find(
      (s: any) => s.coupon_code && s.coupon_code.toUpperCase() === clean && s.active
    );

    if (matchedSeller) {
      const discountPct = Number(matchedSeller.customer_discount_pct) || 0;
      const discountAmount = Number(((subtotal * discountPct) / 100).toFixed(2));

      return {
        valid: true,
        code: matchedSeller.coupon_code,
        discount_type: 'PERCENTAGE',
        discount_value: discountPct,
        discount_amount: discountAmount,
        free_shipping: false,
        seller_name: matchedSeller.name,
        commission_pct: Number(matchedSeller.commission_pct) || 10,
        message:
          discountPct > 0
            ? `✓ CUPOM ${matchedSeller.coupon_code} APLICADO • ${discountPct}% OFF (Vendedora: ${matchedSeller.name})`
            : `✓ CUPOM ${matchedSeller.coupon_code} ATIVADO (Vendedora: ${matchedSeller.name})`,
      };
    }
  } catch (_) {}

  return {
    valid: false,
    discount_amount: 0,
    free_shipping: false,
    message: 'Cupom inválido ou não encontrado.',
  };
}
