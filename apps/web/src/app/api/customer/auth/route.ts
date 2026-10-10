import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CUSTOMERS_FILE = path.join(process.cwd(), 'customers_db.json');

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  shipping_address: {
    address: string;
    apt?: string;
    city: string;
    state: string;
    zip: string;
  };
  created_at: string;
  updated_at?: string;
}

const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust-001',
    name: 'Mariana Salles',
    email: 'mariana.salles@gmail.com',
    phone: '+1 (508) 492-8819',
    password: '123',
    shipping_address: {
      address: '742 Commonwealth Ave',
      apt: 'Apt 4B',
      city: 'Boston',
      state: 'MA',
      zip: '02215',
    },
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: 'cust-002',
    name: 'Beatriz Figueiredo',
    email: 'beatriz.fig@miamifit.com',
    phone: '+1 (305) 881-2299',
    password: '123',
    shipping_address: {
      address: '1200 Brickell Bay Dr',
      apt: 'Suite 1205',
      city: 'Miami',
      state: 'FL',
      zip: '33131',
    },
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
  },
  {
    id: 'cust-003',
    name: 'Ana Carina',
    email: 'anafitweareua@gmail.com',
    phone: '+1 (978) 313-9452',
    password: '123',
    shipping_address: {
      address: '100 Main St',
      apt: '',
      city: 'Leominster',
      state: 'MA',
      zip: '01453',
    },
    created_at: new Date().toISOString(),
  },
];

function readCustomers(): CustomerRecord[] {
  try {
    if (!fs.existsSync(CUSTOMERS_FILE)) {
      fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(INITIAL_CUSTOMERS, null, 2), 'utf8');
      return INITIAL_CUSTOMERS;
    }
    const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_CUSTOMERS;
  } catch (e) {
    console.error('Erro ao ler customers_db.json:', e);
    return INITIAL_CUSTOMERS;
  }
}

function saveCustomers(list: CustomerRecord[]) {
  try {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar customers_db.json:', e);
  }
}

function sanitizeCustomer(customer: CustomerRecord) {
  const { password, ...safe } = customer;
  return safe;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();

  const customers = readCustomers();
  if (email) {
    const found = customers.find((c) => c.email.toLowerCase() === email);
    if (!found) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ customer: sanitizeCustomer(found) });
  }

  return NextResponse.json({
    total: customers.length,
    customers: customers.map(sanitizeCustomer),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'login';
    const customers = readCustomers();

    // 1. LOGIN
    if (action === 'login') {
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();

      if (!email || !password) {
        return NextResponse.json({ error: 'Informe e-mail e senha' }, { status: 400 });
      }

      const found = customers.find((c) => c.email.toLowerCase() === email);
      if (!found) {
        return NextResponse.json({ error: 'Conta não encontrada com este e-mail' }, { status: 404 });
      }

      if (found.password && found.password !== password) {
        return NextResponse.json({ error: 'Senha incorreta. Tente novamente.' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        message: 'Login realizado com sucesso',
        customer: sanitizeCustomer(found),
      });
    }

    // 2. CADASTRO (REGISTER)
    if (action === 'register') {
      const email = (body.email || '').trim().toLowerCase();
      const name = (body.name || '').trim();
      const phone = (body.phone || '').trim();
      const password = (body.password || '').trim();

      if (!email || !name || !password) {
        return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 });
      }

      const existing = customers.find((c) => c.email.toLowerCase() === email);
      if (existing) {
        return NextResponse.json(
          { error: 'Já existe uma conta com este e-mail. Faça login ou use outro e-mail.' },
          { status: 409 }
        );
      }

      const newCustomer: CustomerRecord = {
        id: `cust-${Date.now().toString().slice(-6)}`,
        name,
        email,
        phone,
        password,
        shipping_address: {
          address: body.shipping_address?.address || '',
          apt: body.shipping_address?.apt || '',
          city: body.shipping_address?.city || '',
          state: body.shipping_address?.state || 'MA',
          zip: body.shipping_address?.zip || '',
        },
        created_at: new Date().toISOString(),
      };

      customers.push(newCustomer);
      saveCustomers(customers);

      return NextResponse.json({
        success: true,
        message: 'Conta criada com sucesso!',
        customer: sanitizeCustomer(newCustomer),
      });
    }

    // 3. ATUALIZAR PERFIL / ENDEREÇO
    if (action === 'update_profile') {
      const email = (body.email || '').trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: 'E-mail não informado' }, { status: 400 });
      }

      const idx = customers.findIndex((c) => c.email.toLowerCase() === email);
      if (idx === -1) {
        return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
      }

      const current = customers[idx];
      const updated: CustomerRecord = {
        ...current,
        name: body.name ? body.name.trim() : current.name,
        phone: body.phone !== undefined ? body.phone.trim() : current.phone,
        shipping_address: {
          ...current.shipping_address,
          ...(body.shipping_address || {}),
        },
        updated_at: new Date().toISOString(),
      };

      if (body.password && body.password.trim()) {
        updated.password = body.password.trim();
      }

      customers[idx] = updated;
      saveCustomers(customers);

      return NextResponse.json({
        success: true,
        message: 'Dados atualizados com sucesso!',
        customer: sanitizeCustomer(updated),
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro no servidor' }, { status: 500 });
  }
}
