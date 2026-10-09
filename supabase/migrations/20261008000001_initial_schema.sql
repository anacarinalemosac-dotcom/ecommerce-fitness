-- ==============================================================================
-- 1. TABELAS PRINCIPAIS (ORDEM CORRETA DE DEPENDÊNCIAS)
-- ==============================================================================

-- 1.1 Fornecedores (Confecções parceiras - Dados sensíveis da empresa)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Vendedoras & Cupons de Comissão
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  coupon_code VARCHAR(50) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 5.00, -- Ex: 5.00% (Dado comercial protegido)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Categorias Fitness (Leggings, Tops, Shorts, Macacões)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);

-- 1.4 Catálogo de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Variações de Produto (SKU, Tamanho, Cor, Mídias, Estoque e Encomenda)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  barcode VARCHAR(50) UNIQUE, -- Leitor óptico no PDV
  size VARCHAR(10) NOT NULL,  -- P, M, G, GG
  color VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) DEFAULT 0.00, -- Preço de custo (Protegido contra leitura pública)
  stock_quantity INT NOT NULL DEFAULT 0,
  allow_backorder BOOLEAN DEFAULT false,
  estimated_production_days INT DEFAULT 7,
  images TEXT[] DEFAULT '{}',
  video_url TEXT, -- Vídeo curto demonstrando caimento/elasticidade
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_barcode_sku ON product_variants(barcode, sku);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);

-- 1.6 Pedidos (Omnichannel: E-commerce e PDV - Dados de Clientes e Pagamentos)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('ONLINE', 'POS')),
  seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  coupon_code VARCHAR(50),
  customer_name VARCHAR(255) NOT NULL,
  customer_cpf VARCHAR(20),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  subtotal_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL, -- PIX, CREDIT_CARD, DEBIT_CARD, CASH
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 1.7 Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  is_backorder BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ==============================================================================
-- 2. FUNÇÃO ATÔMICA DE CHECKOUT E CONTROLE DE ESTOQUE (RPC)
-- ==============================================================================
-- Bloqueia a linha da variação (FOR UPDATE) para prevenir concorrência e overselling.
-- Configurada com SECURITY DEFINER e search_path para blindagem contra injeções.
CREATE OR REPLACE FUNCTION process_checkout_item(
  p_variant_id UUID,
  p_quantity INT
)
RETURNS TABLE (
  variant_id UUID,
  unit_price DECIMAL(10,2),
  is_backorder BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock INT;
  v_allow_backorder BOOLEAN;
  v_price DECIMAL(10,2);
  v_is_backorder BOOLEAN := false;
BEGIN
  -- Bloqueio pessimista de linha (evita concorrência entre PDV e Loja Virtual)
  SELECT stock_quantity, allow_backorder, price 
  INTO v_stock, v_allow_backorder, v_price
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variação % não encontrada.', p_variant_id;
  END IF;

  IF v_stock >= p_quantity THEN
    -- Há estoque imediato: decrementa
    UPDATE product_variants
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_variant_id;
    v_is_backorder := false;
  ELSIF v_allow_backorder THEN
    -- Sem estoque imediato, mas permite encomenda (pre-order)
    v_is_backorder := true;
  ELSE
    RAISE EXCEPTION 'Estoque insuficiente para a variação % e encomendas não permitidas.', p_variant_id;
  END IF;

  RETURN QUERY SELECT p_variant_id, v_price, v_is_backorder;
END;
$$;

-- Restringe a execução do RPC para evitar chamadas maliciosas diretas no cliente
REVOKE EXECUTE ON FUNCTION process_checkout_item(UUID, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION process_checkout_item(UUID, INT) TO authenticated, service_role;

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) & BLINDAGEM DE DADOS SENSÍVEIS
-- ==============================================================================
-- Habilita RLS em TODAS as tabelas públicas (resolve o alerta do Supabase Advisor)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 3.1 Fornecedores (suppliers): Totalmente privado
-- Apenas service_role (backend ERP) pode ler/escrever. Clientes e anônimos têm acesso negado.
-- (Sem políticas públicas = Default Deny seguro)

-- 3.2 Pedidos e Clientes (orders e order_items): Totalmente privado contra anon
-- Nenhum cliente ou scraper com a anon key consegue ler nomes, CPFs, e-mails, endereços ou compras de terceiros.
-- Todas as operações são intermediadas com segurança pelo backend NestJS via service_role.
-- (Sem políticas públicas = Default Deny seguro para anon)

-- 3.3 Categorias e Produtos: Vitrine Pública
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products 
  FOR SELECT TO anon, authenticated USING (true);

-- 3.4 Variações de Produto (product_variants): Proteção de Custo Industrial (cost_price)
DROP POLICY IF EXISTS "Public Read Variants" ON product_variants;
CREATE POLICY "Public Read Variants" ON product_variants 
  FOR SELECT TO anon, authenticated USING (true);

-- Revoga leitura da tabela inteira para anon/authenticated e concede apenas as colunas públicas da vitrine.
-- A coluna sensível 'cost_price' fica completamente inacessível para usuários anônimos no navegador.
REVOKE ALL ON product_variants FROM anon, authenticated;
GRANT SELECT (
  id,
  product_id,
  sku,
  barcode,
  size,
  color,
  price,
  stock_quantity,
  allow_backorder,
  estimated_production_days,
  images,
  video_url,
  created_at
) ON product_variants TO anon, authenticated;

-- 3.5 Vendedoras (sellers): Proteção de Margem de Comissão (commission_rate)
DROP POLICY IF EXISTS "Public Read Active Sellers" ON sellers;
CREATE POLICY "Public Read Active Sellers" ON sellers 
  FOR SELECT TO anon, authenticated USING (active = true);

-- Apenas o código do cupom e o nome são expostos publicamente para validação na vitrine.
-- A margem percentual 'commission_rate' fica oculta para anon.
REVOKE ALL ON sellers FROM anon;
GRANT SELECT (
  id,
  name,
  coupon_code,
  active,
  created_at
) ON sellers TO anon;
