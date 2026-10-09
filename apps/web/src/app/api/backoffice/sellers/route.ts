import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SELLERS_FILE = path.join(process.cwd(), 'sellers_db.json');

export interface SellerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // Senha para login no portal da vendedora
  coupon_code: string; // ex: CAMILA10
  commission_pct: number; // ex: 10% comissão que a dona paga para a vendedora
  customer_discount_pct: number; // ex: 10% de desconto pro cliente (ou 0% se for sem desconto)
  channel: 'ALL' | 'ONLINE' | 'POS_COUNTER';
  active: boolean;
  total_sales_count: number;
  total_revenue_generated: number;
  total_commission_earned: number;
  total_commission_paid: number;
  created_at: string;
}

const INITIAL_SELLERS: SellerRecord[] = [
  {
    id: 'seller-01',
    name: 'Camila Santos',
    email: 'camila@anafitnesswear.com',
    phone: '+1 (508) 772-1100',
    password: 'camila123',
    coupon_code: 'CAMILA10',
    commission_pct: 10.0,
    customer_discount_pct: 10.0,
    channel: 'ALL',
    active: true,
    total_sales_count: 14,
    total_revenue_generated: 1420.50,
    total_commission_earned: 142.05,
    total_commission_paid: 0.00,
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'seller-02',
    name: 'Juliana Silva',
    email: 'juliana@anafitnesswear.com',
    phone: '+1 (978) 400-3321',
    password: 'juliana123',
    coupon_code: 'JULIANA10',
    commission_pct: 10.0,
    customer_discount_pct: 0.0, // Cliente paga valor cheio, vendedora ganha 10%
    channel: 'POS_COUNTER',
    active: true,
    total_sales_count: 22,
    total_revenue_generated: 2890.00,
    total_commission_earned: 289.00,
    total_commission_paid: 150.00,
    created_at: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
  },
  {
    id: 'seller-03',
    name: 'Beatriz Lima (Embaixadora Boston)',
    email: 'beatriz@bostonfit.com',
    phone: '+1 (617) 502-9912',
    password: 'beatriz123',
    coupon_code: 'BEATRIZVIP',
    commission_pct: 12.0,
    customer_discount_pct: 5.0, // Cliente ganha 5%, influenciadora ganha 12%
    channel: 'ONLINE',
    active: true,
    total_sales_count: 8,
    total_revenue_generated: 840.00,
    total_commission_earned: 100.80,
    total_commission_paid: 0.00,
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
  },
];

function readSellers(): SellerRecord[] {
  try {
    if (fs.existsSync(SELLERS_FILE)) {
      const raw = fs.readFileSync(SELLERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler sellers_db.json:', e);
  }
  return INITIAL_SELLERS;
}

function writeSellers(sellers: SellerRecord[]) {
  try {
    fs.writeFileSync(SELLERS_FILE, JSON.stringify(sellers, null, 2), 'utf8');
  } catch (e) {
    console.warn('Erro ao salvar sellers_db.json:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const couponQuery = searchParams.get('coupon');
    const sellers = readSellers();

    // Se a busca for por um cupom específico (ex: pelo checkout)
    if (couponQuery) {
      const cleanCoupon = couponQuery.trim().toUpperCase();
      const matched = sellers.find((s) => s.coupon_code.toUpperCase() === cleanCoupon && s.active);
      if (!matched) {
        return NextResponse.json({ error: 'Cupom inválido ou inativo.' }, { status: 404 });
      }
      return NextResponse.json({
        coupon: {
          code: matched.coupon_code,
          seller_name: matched.name,
          customer_discount_pct: matched.customer_discount_pct,
          commission_pct: matched.commission_pct,
        },
      });
    }

    return NextResponse.json({ sellers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sellers = readSellers();

    // 1. Ação de Criar / Atualizar Vendedora
    if (body.action === 'save') {
      const {
        id,
        name,
        email,
        phone,
        password,
        coupon_code,
        commission_pct = 10,
        customer_discount_pct = 10,
        channel = 'ALL',
        active = true,
      } = body.seller;

      if (!name || !coupon_code) {
        return NextResponse.json({ error: 'Nome e código do cupom são obrigatórios.' }, { status: 400 });
      }

      const cleanCoupon = coupon_code.trim().toUpperCase();

      if (id) {
        // Atualização
        const updatedList = sellers.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              name,
              email: email || s.email,
              phone: phone || s.phone,
              password: password || s.password,
              coupon_code: cleanCoupon,
              commission_pct: Number(commission_pct),
              customer_discount_pct: Number(customer_discount_pct),
              channel,
              active,
            };
          }
          return s;
        });
        writeSellers(updatedList);
        return NextResponse.json({ sellers: updatedList });
      } else {
        // Nova Vendedora
        const newSeller: SellerRecord = {
          id: `seller-${Date.now()}`,
          name,
          email: email || `${cleanCoupon.toLowerCase()}@anafitnesswear.com`,
          phone: phone || '',
          password: password || 'ana123',
          coupon_code: cleanCoupon,
          commission_pct: Number(commission_pct),
          customer_discount_pct: Number(customer_discount_pct),
          channel,
          active: true,
          total_sales_count: 0,
          total_revenue_generated: 0,
          total_commission_earned: 0,
          total_commission_paid: 0,
          created_at: new Date().toISOString(),
        };
        const newList = [newSeller, ...sellers];
        writeSellers(newList);
        return NextResponse.json({ sellers: newList });
      }
    }

    // 1.1 Ação de Auto-Cadastro de Vendedora / Embaixadora pelo site
    if (body.action === 'register') {
      const { name, email, phone, password, coupon_code, instagram } = body;
      if (!name || !password || !coupon_code) {
        return NextResponse.json({ error: 'Nome, senha e código do cupom desejado são obrigatórios.' }, { status: 400 });
      }

      const cleanCoupon = coupon_code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanCoupon.length < 3) {
        return NextResponse.json({ error: 'O cupom deve ter pelo menos 3 letras ou números.' }, { status: 400 });
      }

      const existing = sellers.find((s) => s.coupon_code.toUpperCase() === cleanCoupon);
      if (existing) {
        return NextResponse.json({ error: `O cupom ${cleanCoupon} já está em uso por outra vendedora. Escolha outro código.` }, { status: 400 });
      }

      const newSeller: SellerRecord = {
        id: `seller-${Date.now()}`,
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : `${cleanCoupon.toLowerCase()}@anafitnesswear.com`,
        phone: phone ? phone.trim() : (instagram ? `@${instagram.replace('@', '')}` : ''),
        password: password.trim(),
        coupon_code: cleanCoupon,
        commission_pct: 10.0, // Comissão padrão inicial de 10%
        customer_discount_pct: 0.0, // Cliente paga preço normal da loja
        channel: 'ALL',
        active: true,
        total_sales_count: 0,
        total_revenue_generated: 0,
        total_commission_earned: 0,
        total_commission_paid: 0,
        created_at: new Date().toISOString(),
      };

      const newList = [newSeller, ...sellers];
      writeSellers(newList);

      return NextResponse.json({ success: true, seller: newSeller });
    }

    // 2. Ação de Login da Vendedora no Portal
    if (body.action === 'login') {
      const { identifier, password } = body;
      const cleanIdent = (identifier || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      const matched = sellers.find(
        (s) =>
          (s.email.toLowerCase() === cleanIdent || s.coupon_code.toLowerCase() === cleanIdent) &&
          s.password === cleanPass &&
          s.active
      );

      if (!matched) {
        return NextResponse.json(
          { error: 'Credenciais inválidas ou cadastro inativo. Verifique seu e-mail/cupom e senha.' },
          { status: 401 }
        );
      }

      // Retorna os dados seguros da vendedora (sem dados sigilosos da empresa)
      return NextResponse.json({
        seller: {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          phone: matched.phone,
          coupon_code: matched.coupon_code,
          commission_pct: matched.commission_pct,
          customer_discount_pct: matched.customer_discount_pct,
          total_sales_count: matched.total_sales_count,
          total_revenue_generated: matched.total_revenue_generated,
          total_commission_earned: matched.total_commission_earned,
          total_commission_paid: matched.total_commission_paid,
        },
      });
    }

    // 3. Ação de Marcar Pagamento de Comissão
    if (body.action === 'mark_paid') {
      const { seller_id, amount } = body;
      const updatedList = sellers.map((s) => {
        if (s.id === seller_id) {
          return {
            ...s,
            total_commission_paid: Number((s.total_commission_paid + Number(amount)).toFixed(2)),
          };
        }
        return s;
      });
      writeSellers(updatedList);
      return NextResponse.json({ sellers: updatedList });
    }

    // 4. Ação de Excluir / Desativar
    if (body.action === 'toggle_active') {
      const { seller_id } = body;
      const updatedList = sellers.map((s) => {
        if (s.id === seller_id) {
          return { ...s, active: !s.active };
        }
        return s;
      });
      writeSellers(updatedList);
      return NextResponse.json({ sellers: updatedList });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
