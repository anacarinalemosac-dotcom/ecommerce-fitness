# 🏋️‍♀️ FitOmni - E-commerce Fitness Omnichannel & Backoffice

Sistema completo omnichannel desenvolvido para moda fitness, integrando vendas online, terminal de balcão (PDV), comissões de vendedoras por cupom, controle de encomendas (pre-order) e integração com TikTok.

---

## 📁 Estrutura do Monorepo

```text
fitness-store/
├── apps/
│   ├── api/                   # Backend NestJS (REST, Vercel Serverless, Supabase, TikTok Events)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── catalog/   # Produtos, variações e controle de estoque
│   │   │   │   ├── orders/    # Checkout, validação de cupom e encomendas
│   │   │   │   ├── pos/       # Terminal de PDV físico (código de barras, resumo do caixa)
│   │   │   │   ├── tiktok/    # Events API (server-side tracking) e Feed de Catálogo
│   │   │   │   └── supabase/  # Conexão centralizada com PostgreSQL/Supabase
│   │   │   ├── main.ts        # Entrypoint local (Porta 4000)
│   │   │   └── vercel.ts      # Handler serverless para a Vercel
│   │   └── vercel.json        # Configuração de rotas serverless
│   │
│   └── web/                   # Frontend Next.js 14 + Tailwind CSS
│       └── src/app/
│           ├── page.tsx       # Loja virtual (Mobile-First com vídeo de caimento e pré-venda)
│           ├── pos/page.tsx   # Interface ágil de PDV para vendedoras
│           └── backoffice/    # Painel ERP de encomendas, comissões e fornecedores
│
├── supabase/
│   ├── migrations/            # Script SQL com tabelas, RLS e RPC atômico de checkout
│   └── seed.sql               # Dados de teste (tamanhos P/M/G, cupons e estoque)
└── package.json
```

---

## ⚡ Passo a Passo de Execução

### 1. Pré-requisito: Node.js
Se o Node.js ainda não estiver instalado no Windows, execute no terminal PowerShell:
```powershell
winget install --id OpenJS.NodeJS.LTS -e
```
*(Após a instalação, reinicie o terminal para atualizar o PATH).*

### 2. Configurar o Banco de Dados no Supabase
1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Acesse o **SQL Editor** no painel do Supabase.
3. Cole e execute o arquivo [`supabase/migrations/20261008000001_initial_schema.sql`](./supabase/migrations/20261008000001_initial_schema.sql).
4. Em seguida, cole e execute o arquivo [`supabase/seed.sql`](./supabase/seed.sql) para carregar os dados de exemplo.
5. Copie a **URL do projeto** e a chave **anon public** em *Project Settings > API*.

### 3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Preencha com as credenciais do seu Supabase e chaves do TikTok.

### 4. Instalar Dependências e Executar Localmente
```bash
# Na raiz do projeto:
npm install

# Iniciar o backend NestJS (Porta 4000):
npm run dev:api

# Iniciar o frontend Next.js (Porta 3000):
npm run dev:web
```

Acesse:
- **Loja Virtual:** [http://localhost:3000](http://localhost:3000)
- **PDV Vendedora:** [http://localhost:3000/pos](http://localhost:3000/pos)
- **ERP Backoffice:** [http://localhost:3000/backoffice](http://localhost:3000/backoffice)

---

## 🌐 Deploy na Vercel & Apontamento no Wix

1. **Deploy:** Conecte o repositório GitHub na Vercel ou use a Vercel CLI (`vercel`). Configure as variáveis de ambiente no painel da Vercel.
2. **DNS Wix:**
   - Acesse o painel do Wix > *Gerenciamento de Domínios > Configurações de DNS*.
   - Crie o registro **A**: `@` -> `76.76.21.21`
   - Crie o registro **CNAME**: `www` -> `cname.vercel-dns.com`
