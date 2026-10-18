import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { recordLiveEvent } from '@/lib/liveStore';
import { supabaseServer } from '@/lib/supabaseServer';

const SELLERS_ROW_ID = '00000000-0000-0000-0000-000000000092';
const SELLERS_SLUG = '__sellers_db_state__';
const SELLERS_FILE = path.join(process.cwd(), 'sellers_db.json');

export interface SellerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // Senha para login no portal da vendedora
  coupon_code: string;
  commission_pct: number; // ex: 10% comissão que a dona paga para a vendedora
  customer_discount_pct: number; // ex: 10% de desconto pro cliente (ou 0% se for sem desconto)
  channel: 'ALL' | 'ONLINE' | 'POS_COUNTER';
  active: boolean;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payout_method: 'ZELLE' | 'VENMO' | 'CASHAPP' | 'PIX' | 'BANK';
  payout_key: string; // Chave PIX, E-mail ou Telefone Zelle, @Venmo, etc.
  payout_beneficiary?: string; // Nome do titular da conta
  accepted_ethics_terms?: boolean;
  accepted_ethics_terms_at?: string;
  total_sales_count: number;
  total_revenue_generated: number;
  total_commission_earned: number;
  total_commission_paid: number;
  created_at: string;
}

// Cache em memória para rápida resposta entre requisições
let memorySellers: SellerRecord[] | null = null;
let lastSellersFetch = 0;

const DEFAULT_SEED_SELLERS: SellerRecord[] = [
  {
    id: 'seller-beatriz',
    name: 'Beatriz Figueredo',
    email: 'beatriz.fig@miamifit.com',
    phone: '+1 (305) 555-0199',
    password: 'ana123',
    coupon_code: 'BEATRIZ10',
    commission_pct: 10,
    customer_discount_pct: 10,
    channel: 'ALL',
    active: true,
    approval_status: 'APPROVED',
    payout_method: 'ZELLE',
    payout_key: 'beatriz.fig@miamifit.com',
    payout_beneficiary: 'Beatriz Figueredo',
    total_sales_count: 0,
    total_revenue_generated: 0,
    total_commission_earned: 0,
    total_commission_paid: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'seller-camila',
    name: 'Camila Rocha',
    email: 'camila.rocha@fitness.com',
    phone: '+1 (407) 555-0144',
    password: 'ana123',
    coupon_code: 'CAMILA10',
    commission_pct: 10,
    customer_discount_pct: 10,
    channel: 'ALL',
    active: true,
    approval_status: 'APPROVED',
    payout_method: 'ZELLE',
    payout_key: 'camila.rocha@fitness.com',
    payout_beneficiary: 'Camila Rocha',
    total_sales_count: 0,
    total_revenue_generated: 0,
    total_commission_earned: 0,
    total_commission_paid: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'seller-juliana',
    name: 'Juliana Mendes',
    email: 'juliana.mendes@bostonfit.com',
    phone: '+1 (508) 555-0177',
    password: 'ana123',
    coupon_code: 'JULIANA10',
    commission_pct: 10,
    customer_discount_pct: 10,
    channel: 'ALL',
    active: true,
    approval_status: 'APPROVED',
    payout_method: 'ZELLE',
    payout_key: 'juliana.mendes@bostonfit.com',
    payout_beneficiary: 'Juliana Mendes',
    total_sales_count: 0,
    total_revenue_generated: 0,
    total_commission_earned: 0,
    total_commission_paid: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'seller-mariana',
    name: 'Mariana Salles',
    email: 'mariana.salles@gmail.com',
    phone: '+1 (617) 555-0188',
    password: 'ana123',
    coupon_code: 'MARIANA10',
    commission_pct: 10,
    customer_discount_pct: 10,
    channel: 'ALL',
    active: true,
    approval_status: 'APPROVED',
    payout_method: 'ZELLE',
    payout_key: 'mariana.salles@gmail.com',
    payout_beneficiary: 'Mariana Salles',
    total_sales_count: 0,
    total_revenue_generated: 0,
    total_commission_earned: 0,
    total_commission_paid: 0,
    created_at: new Date().toISOString(),
  },
];

// Helper para fundir vendedoras padrão com as salvas no banco
function mergeDefaultSellers(loaded: SellerRecord[]): SellerRecord[] {
  const result = [...loaded];
  for (const def of DEFAULT_SEED_SELLERS) {
    if (!result.some((s) => s.coupon_code.toUpperCase() === def.coupon_code.toUpperCase() || s.name.toLowerCase() === def.name.toLowerCase())) {
      result.push(def);
    }
  }
  return result;
}

async function readSellers(): Promise<SellerRecord[]> {
  const now = Date.now();
  if (memorySellers && now - lastSellersFetch < 3000) {
    return memorySellers;
  }

  // 1. Tenta carregar do Supabase (Nuvem em produção / Vercel)
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', SELLERS_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memorySellers = mergeDefaultSellers(parsed.map((s: any) => ({
            ...s,
            password: (s.password && s.password.trim() !== '') ? s.password.trim() : 'ana123',
            approval_status: s.approval_status || (s.active ? 'APPROVED' : 'PENDING'),
          })));
          lastSellersFetch = now;
          return memorySellers;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Erro ao ler vendedoras do Supabase:', err);
  }

  // 2. Fallback para arquivo local se existir
  try {
    if (fs.existsSync(SELLERS_FILE)) {
      const raw = fs.readFileSync(SELLERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memorySellers = mergeDefaultSellers(parsed.map((s: any) => ({
          ...s,
          password: (s.password && s.password.trim() !== '') ? s.password.trim() : 'ana123',
          approval_status: s.approval_status || (s.active ? 'APPROVED' : 'PENDING'),
        })));
        lastSellersFetch = now;
        return memorySellers;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler sellers_db.json:', e);
  }

  memorySellers = DEFAULT_SEED_SELLERS;
  lastSellersFetch = now;
  return memorySellers;
}

async function writeSellers(sellers: SellerRecord[]): Promise<void> {
  memorySellers = sellers;
  lastSellersFetch = Date.now();
  const serialized = JSON.stringify(sellers, null, 2);

  // 1. Salva no Supabase (Nuvem permanente para produção)
  try {
    await supabaseServer.from('products').upsert({
      id: SELLERS_ROW_ID,
      title: '__SELLERS_DB_STATE__',
      slug: SELLERS_SLUG,
      description: serialized,
    });
  } catch (err) {
    console.warn('Erro ao salvar vendedoras no Supabase:', err);
  }

  // 2. Salva no arquivo local (quando permitido pelo ambiente)
  try {
    fs.writeFileSync(SELLERS_FILE, serialized, 'utf8');
  } catch (e) {
    console.warn('Erro ao salvar sellers_db.json:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const couponQuery = searchParams.get('coupon');
    const sellers = await readSellers();

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

    return NextResponse.json({ success: true, sellers, data: sellers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sellers = await readSellers();

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
        payout_method = 'ZELLE',
        payout_key = '',
        payout_beneficiary = '',
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
              password: (password && password.trim() !== '') ? password.trim() : (s.password || 'ana123'),
              coupon_code: cleanCoupon,
              commission_pct: Number(commission_pct),
              customer_discount_pct: Number(customer_discount_pct),
              channel,
              active,
              payout_method: payout_method || s.payout_method || 'ZELLE',
              payout_key: payout_key !== undefined ? payout_key : (s.payout_key || ''),
              payout_beneficiary: payout_beneficiary !== undefined ? payout_beneficiary : (s.payout_beneficiary || ''),
            };
          }
          return s;
        });
        await writeSellers(updatedList);
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
          approval_status: 'APPROVED',
          payout_method: payout_method || 'ZELLE',
          payout_key: payout_key || phone || '',
          payout_beneficiary: payout_beneficiary || name,
          total_sales_count: 0,
          total_revenue_generated: 0,
          total_commission_earned: 0,
          total_commission_paid: 0,
          created_at: new Date().toISOString(),
        };
        const newList = [newSeller, ...sellers];
        await writeSellers(newList);
        return NextResponse.json({ sellers: newList });
      }
    }

    // 1.1 Ação de Auto-Cadastro de Vendedora / Embaixadora pelo site
    // ⚠️ REGRA CRUCIAL: O cadastro público nasce INATIVO (PENDING) aguardando aprovação de Ana Carina!
    if (body.action === 'register') {
      const { name, email, phone, password, coupon_code, instagram, payout_method = 'ZELLE', payout_key = '', payout_beneficiary = '' } = body;
      if (!name || !password || !coupon_code) {
        return NextResponse.json({ error: 'Nome, senha e código do cupom desejado são obrigatórios.' }, { status: 400 });
      }

      const cleanCoupon = coupon_code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanCoupon.length < 3) {
        return NextResponse.json({ error: 'O cupom deve ter pelo menos 3 letras ou números.' }, { status: 400 });
      }

      const existingByCoupon = sellers.find((s) => s.coupon_code.toUpperCase() === cleanCoupon);
      const existingByEmail = email ? sellers.find((s) => s.email.toLowerCase() === email.trim().toLowerCase()) : null;
      const existing = existingByCoupon || existingByEmail;

      if (existing) {
        // Se a vendedora está se recadastrando ou atualizando seu cadastro, atualiza seus dados reais e senha real!
        const updatedList = sellers.map((s) => {
          if (s.id === existing.id) {
            return {
              ...s,
              name: name.trim(),
              email: email ? email.trim().toLowerCase() : s.email,
              phone: phone ? phone.trim() : (instagram ? `@${instagram.replace('@', '')}` : s.phone),
              password: password.trim(), // Salva a senha real digitada pela vendedora
              coupon_code: cleanCoupon,
              payout_method: payout_method ? (payout_method as any) : (s.payout_method || 'ZELLE'),
              payout_key: payout_key ? payout_key.trim() : s.payout_key,
              payout_beneficiary: payout_beneficiary ? payout_beneficiary.trim() : (s.payout_beneficiary || name.trim()),
              accepted_ethics_terms: true,
              accepted_ethics_terms_at: new Date().toISOString(),
              active: s.active,
              approval_status: s.approval_status || 'PENDING',
            };
          }
          return s;
        });
        await writeSellers(updatedList);

        const updated = updatedList.find((s) => s.id === existing.id);

        return NextResponse.json({
          success: true,
          updated: true,
          seller: updated,
          pending_approval: updated?.approval_status === 'PENDING',
          message: updated?.active
            ? 'Cadastro e senha atualizados com sucesso! Seu acesso já está liberado.'
            : 'Cadastro e senha atualizados com sucesso e enviados para análise de Ana Carina.',
        });
      }

      const newSeller: SellerRecord = {
        id: `seller-${Date.now()}`,
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : `${cleanCoupon.toLowerCase()}@anafitnesswear.com`,
        phone: phone ? phone.trim() : (instagram ? `@${instagram.replace('@', '')}` : ''),
        password: password.trim(),
        coupon_code: cleanCoupon,
        commission_pct: 10.0, // Proposta padrão inicial de 10%
        customer_discount_pct: 0.0, // Cliente paga preço normal da loja
        channel: 'ALL',
        active: false, // 🔒 NASCE BLOQUEADO ATÉ APROVAÇÃO
        approval_status: 'PENDING',
        payout_method: payout_method as any,
        payout_key: payout_key || phone || '',
        payout_beneficiary: payout_beneficiary || name.trim(),
        accepted_ethics_terms: true,
        accepted_ethics_terms_at: new Date().toISOString(),
        total_sales_count: 0,
        total_revenue_generated: 0,
        total_commission_earned: 0,
        total_commission_paid: 0,
        created_at: new Date().toISOString(),
      };

      const newList = [newSeller, ...sellers];
      await writeSellers(newList);

      // Dispara notificação em tempo real no Backoffice para alertar Ana Carina
      await recordLiveEvent({
        type: 'NEW_VISITOR',
        title: 'NOVA SOLICITAÇÃO DE VENDEDORA!',
        description: `📋 ${name.trim()} solicitou cadastro com o cupom ${cleanCoupon}. Acesse o Backoffice para aprovar!`,
        city: 'Aguardando Aprovação',
      });

      return NextResponse.json({
        success: true,
        pending_approval: true,
        seller: newSeller,
        message: 'Cadastro recebido com sucesso e enviado para análise de Ana Carina.',
      });
    }

    // 1.2 Ação de Atualizar Dados de Pagamento/Repasse pela Vendedora
    if (body.action === 'update_payout') {
      const { seller_id, payout_method = 'ZELLE', payout_key = '', payout_beneficiary = '' } = body;
      const updatedList = sellers.map((s) => {
        if (s.id === seller_id) {
          return {
            ...s,
            payout_method: payout_method as any,
            payout_key: payout_key.trim(),
            payout_beneficiary: payout_beneficiary.trim(),
          };
        }
        return s;
      });
      await writeSellers(updatedList);
      const updated = updatedList.find((s) => s.id === seller_id);
      return NextResponse.json({ success: true, seller: updated });
    }

    // 1.3 Ação de Redefinir Senha pela Vendedora (Recuperação direta de acesso)
    if (body.action === 'reset_password') {
      const { identifier, new_password } = body;
      if (!identifier || !new_password || new_password.trim().length < 4) {
        return NextResponse.json(
          { error: 'Informe seu e-mail ou cupom e a nova senha desejada (mínimo 4 caracteres).' },
          { status: 400 }
        );
      }

      const cleanIdent = identifier.trim().toLowerCase();
      const cleanDigits = cleanIdent.replace(/\D/g, '');
      const isPhoneMatch = (s: SellerRecord) => {
        if (!s.phone || cleanDigits.length < 8) return false;
        const sDigits = s.phone.replace(/\D/g, '');
        return sDigits.endsWith(cleanDigits) || cleanDigits.endsWith(sDigits);
      };

      const matched = sellers.find(
        (s) =>
          s.email.toLowerCase() === cleanIdent ||
          s.coupon_code.toLowerCase() === cleanIdent ||
          isPhoneMatch(s)
      );

      if (!matched) {
        return NextResponse.json(
          { error: 'Nenhuma vendedora encontrada com este e-mail ou cupom. Verifique se digitou corretamente.' },
          { status: 404 }
        );
      }

      const updatedList = sellers.map((s) => {
        if (s.id === matched.id) {
          return {
            ...s,
            password: new_password.trim(),
          };
        }
        return s;
      });
      await writeSellers(updatedList);
      const updated = updatedList.find((s) => s.id === matched.id);

      return NextResponse.json({
        success: true,
        message: 'Senha atualizada com sucesso!',
        seller: updated,
      });
    }

    // 2. Ação de Login da Vendedora no Portal
    if (body.action === 'login') {
      const { identifier, password } = body;
      const cleanIdent = (identifier || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();
      const cleanDigits = cleanIdent.replace(/\D/g, '');
      const isPhoneMatch = (s: SellerRecord) => {
        if (!s.phone || cleanDigits.length < 8) return false;
        const sDigits = s.phone.replace(/\D/g, '');
        return sDigits.endsWith(cleanDigits) || cleanDigits.endsWith(sDigits);
      };

      let matched = sellers.find(
        (s) =>
          (s.email.toLowerCase() === cleanIdent ||
            s.coupon_code.toLowerCase() === cleanIdent ||
            isPhoneMatch(s)) &&
          s.password === cleanPass
      );

      // Fallback: se não bateu exata, tenta case-insensitive para evitar erro de maiúscula automática do celular
      if (!matched) {
        matched = sellers.find(
          (s) =>
            (s.email.toLowerCase() === cleanIdent ||
              s.coupon_code.toLowerCase() === cleanIdent ||
              isPhoneMatch(s)) &&
            s.password.trim().toLowerCase() === cleanPass.toLowerCase()
        );
      }

      if (!matched) {
        return NextResponse.json(
          { error: 'Credenciais inválidas. Verifique seu e-mail ou cupom e sua senha.' },
          { status: 401 }
        );
      }

      // Se a vendedora foi recém-cadastrada ou está desativada, bloqueia e avisa
      if (!matched.active || matched.approval_status === 'PENDING') {
        return NextResponse.json(
          {
            error: 'Seu cadastro foi recebido com sucesso e está AGUARDANDO APROVAÇÃO de Ana Carina. Assim que seu cadastro for aprovado pela gerência, seu cupom e acesso serão liberados!',
            pending_approval: true,
          },
          { status: 403 }
        );
      }

      // Retorna os dados seguros da vendedora
      return NextResponse.json({
        seller: {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          phone: matched.phone,
          coupon_code: matched.coupon_code,
          commission_pct: matched.commission_pct,
          customer_discount_pct: matched.customer_discount_pct,
          payout_method: matched.payout_method || 'ZELLE',
          payout_key: matched.payout_key || '',
          payout_beneficiary: matched.payout_beneficiary || '',
          total_sales_count: matched.total_sales_count,
          total_revenue_generated: matched.total_revenue_generated,
          total_commission_earned: matched.total_commission_earned,
          total_commission_paid: matched.total_commission_paid,
        },
      });
    }

    // 2.1 Ação de APROVAR Vendedora no Backoffice por Ana Carina
    if (body.action === 'approve') {
      const { seller_id, commission_pct, customer_discount_pct, password } = body;
      const updatedList = sellers.map((s) => {
        if (s.id === seller_id) {
          return {
            ...s,
            active: true,
            approval_status: 'APPROVED' as const,
            commission_pct: commission_pct !== undefined ? Number(commission_pct) : s.commission_pct,
            customer_discount_pct: customer_discount_pct !== undefined ? Number(customer_discount_pct) : s.customer_discount_pct,
            password: (password && password.trim() !== '') ? password.trim() : (s.password || 'ana123'),
          };
        }
        return s;
      });
      await writeSellers(updatedList);
      return NextResponse.json({ sellers: updatedList });
    }

    // 2.2 Ação de REPROVAR / EXCLUIR Vendedora do Backoffice
    if (body.action === 'delete' || body.action === 'reject') {
      const { seller_id } = body;
      const updatedList = sellers.filter((s) => s.id !== seller_id);
      await writeSellers(updatedList);
      return NextResponse.json({ sellers: updatedList });
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
      await writeSellers(updatedList);
      return NextResponse.json({ sellers: updatedList });
    }

    // 4. Ação de Alternar Ativação
    if (body.action === 'toggle_active') {
      const { seller_id } = body;
      const updatedList = sellers.map((s) => {
        if (s.id === seller_id) {
          const nextActive = !s.active;
          return {
            ...s,
            active: nextActive,
            approval_status: nextActive ? ('APPROVED' as const) : s.approval_status,
          };
        }
        return s;
      });
      await writeSellers(updatedList);
      return NextResponse.json({ sellers: updatedList });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
