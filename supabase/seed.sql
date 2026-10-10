-- 1. Categorias Fitness
INSERT INTO categories (id, name, slug) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Leggings', 'leggings'),
  ('c1000000-0000-0000-0000-000000000002', 'Tops', 'tops'),
  ('c1000000-0000-0000-0000-000000000003', 'Shorts & Bermudas', 'shorts-bermudas'),
  ('c1000000-0000-0000-0000-000000000004', 'Macacões', 'macacoes')
ON CONFLICT (slug) DO NOTHING;

-- 2. Fornecedor de Confecção
INSERT INTO suppliers (id, company_name, contact_name, phone, email) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Confecções FitPro Brasil', 'Mariana Ramos', '(11) 98765-4321', 'compras@fitprobrasil.com.br')
ON CONFLICT DO NOTHING;

-- 3. Vendedoras & Cupons de Comissão
INSERT INTO sellers (id, name, coupon_code, commission_rate, active) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Camila Personal', 'CAMILA10', 8.00, true),
  ('b1000000-0000-0000-0000-000000000002', 'Juliana Silva (PDV Balcão)', 'JULIANA_PDV', 5.00, true)
ON CONFLICT (coupon_code) DO NOTHING;

-- 4. Catálogo de Produtos
INSERT INTO products (id, title, slug, description, category_id, supplier_id) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Legging Sculpt Efeito Levanta Bumbum', 'legging-sculpt-levanta-bumbum', 'Tecido de alta compressão com cós anatômico duplo. Zero transparência, proteção UV50+ e modelagem que realça a silhueta sem prender movimentos.', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000002', 'Top Nadador Alta Sustentação', 'top-nadador-alta-sustentacao', 'Desenvolvido para treinos de alto impacto como crossfit e corrida. Bojo removível, elástico reforçado no tórax e forro antitranspirante.', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (slug) DO NOTHING;

-- 5. Variações (Legging P em estoque, Legging M com estoque zero para encomenda, e Top)
INSERT INTO product_variants (id, product_id, sku, barcode, size, color, price, cost_price, stock_quantity, allow_backorder, estimated_production_days, images) VALUES
  -- Legging P Preto: 12 unidades (Pronta Entrega)
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'LEG-SCULPT-BLK-P', '7891000000011', 'P', 'Preto Ônix', 149.90, 48.00, 12, true, 5, ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800']),
  -- Legging M Preto: 0 unidades (Dispara automaticamente a opção "Encomendar Peça - Pré-venda")
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'LEG-SCULPT-BLK-M', '7891000000028', 'M', 'Preto Ônix', 149.90, 48.00, 0, true, 7, ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800']),
  -- Top M Vinho: 8 unidades (Pronta Entrega)
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'TOP-NAD-VINHO-M', '7891000000035', 'M', 'Vinho Marsala', 89.90, 26.50, 8, true, 5, ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800'])
ON CONFLICT (sku) DO NOTHING;
