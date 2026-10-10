import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import * as XLSX from 'xlsx';

export interface CSVRowData {
  sku: string;
  title: string;
  category: string;
  subcategory?: string;
  tags?: string;
  color: string;
  size: string;
  price: number;
  promotional_price?: number | null;
  cost_price: number;
  stock_quantity: number;
  allow_backorder: boolean;
  description?: string;
  image_url?: string;
}

export interface ValidationError {
  row: number;
  sku?: string;
  field: string;
  message: string;
}

// Utilitário para conversão precisa de valores monetários em dólares
function parseCurrency(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Number(val.toFixed(2));
  }
  let str = String(val).trim();
  str = str.replace(/[^0-9.,-]/g, '').trim();
  if (!str) return 0;

  if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  } else if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Number(num.toFixed(2));
}

function normalizeHeaderKey(key: string): string {
  return String(key || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Parser universal baseado em SheetJS (para Excel .xlsx, .xls e .csv)
function parseSpreadsheetBuffer(buffer: ArrayBuffer | Buffer): { rows: CSVRowData[]; rawErrors: ValidationError[]; ignoredEmptyCount: number } {
  const wb = XLSX.read(buffer, { type: 'buffer', raw: true });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    return { rows: [], rawErrors: [{ row: 0, field: 'file', message: 'Nenhuma aba encontrada na planilha.' }], ignoredEmptyCount: 0 };
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false, raw: true });

  const rows: CSVRowData[] = [];
  const rawErrors: ValidationError[] = [];
  const seenSkus = new Set<string>();
  let ignoredEmptyCount = 0;

  rawJson.forEach((row, idx) => {
    const lineNum = idx + 2;

    const isAllBlank = Object.values(row).every(
      (v) => v === null || v === undefined || String(v).trim() === ''
    );
    if (isAllBlank) {
      ignoredEmptyCount++;
      return;
    }

    const rowMap: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      rowMap[normalizeHeaderKey(k)] = v;
    }

    const getVal = (aliases: string[]): any => {
      for (const a of aliases) {
        const k = normalizeHeaderKey(a);
        if (rowMap[k] !== undefined && rowMap[k] !== null && String(rowMap[k]).trim() !== '') {
          return rowMap[k];
        }
      }
      return '';
    };

    const sku = String(getVal(['sku', 'codigo', 'cod', 'itemcode', 'productcode', 'referencia'])).trim();
    const title = String(getVal(['title', 'titulo', 'nome', 'product', 'produto', 'productname', 'itemname'])).trim();
    const category = String(getVal(['category', 'categoria', 'departamento', 'department', 'tipo', 'type'])).trim();
    const subcategory = String(getVal(['subcategory', 'subcategoria', 'linha', 'sub_category', 'fitnessline'])).trim() || 'Geral';
    const tags = String(getVal(['tags', 'tag', 'palavraschave', 'keywords'])).trim();
    const color = String(getVal(['color', 'cor', 'colour', 'variacaocor'])).trim();
    const size = String(getVal(['size', 'tamanho', 'tam', 'variacaotamanho'])).trim();

    const priceRaw = getVal(['price', 'preco', 'precoregular', 'regularprice', 'precovenda', 'valor', 'priceusd']);
    const promoRaw = getVal(['promotionalprice', 'promotional_price', 'precopromocional', 'promocional', 'promoprice', 'precooferta', 'oferta', 'desconto']);
    const costRaw = getVal(['costprice', 'cost_price', 'precocusto', 'custo', 'cost', 'custototal', 'precoaquisicao']);
    const stockRaw = getVal(['stockquantity', 'stock_quantity', 'stock', 'estoque', 'quantidade', 'qty', 'qtd', 'inventory']);
    const backorderRaw = getVal(['allowbackorder', 'allow_backorder', 'backorder', 'encomenda', 'prevenda', 'preorder', 'permiteencomenda']);
    const desc = String(getVal(['description', 'descricao', 'detalhes', 'details', 'bio'])).trim();
    const img = String(getVal(['imageurl', 'image_url', 'image', 'imagem', 'foto', 'photo', 'fotos', 'images'])).trim();

    if (!sku && !title) {
      ignoredEmptyCount++;
      return;
    }

    const rowErrors: string[] = [];

    if (!sku) {
      rowErrors.push('SKU obrigatório ausente.');
    } else if (seenSkus.has(sku.toUpperCase())) {
      rowErrors.push(`SKU "${sku}" duplicado no arquivo.`);
    } else {
      seenSkus.add(sku.toUpperCase());
    }

    if (!title) rowErrors.push('Nome/Título do produto obrigatório.');
    if (!category) rowErrors.push('Categoria do produto obrigatória.');
    if (!color) rowErrors.push('Cor da variação obrigatória.');
    if (!size) rowErrors.push('Tamanho da variação obrigatório.');

    const price = parseCurrency(priceRaw);
    if (price <= 0) {
      rowErrors.push(`Preço regular inválido (valor informado: "${priceRaw || 'vazio'}").`);
    }

    const cost = costRaw !== '' ? parseCurrency(costRaw) : 0;
    if (cost < 0 || isNaN(cost)) {
      rowErrors.push(`Preço de custo inválido (valor informado: "${costRaw}").`);
    }

    const promoPrice = promoRaw !== '' ? parseCurrency(promoRaw) : null;
    const stock = parseInt(String(stockRaw).replace(/[^0-9]/g, '')) || 0;
    const backorder =
      backorderRaw !== false &&
      String(backorderRaw).toLowerCase() !== 'false' &&
      String(backorderRaw) !== '0';

    if (rowErrors.length > 0) {
      rowErrors.forEach((msg) => {
        rawErrors.push({
          row: lineNum,
          sku: sku || '---',
          field: msg.split(' ')[0],
          message: `Linha ${lineNum}: ${msg}`,
        });
      });
    } else {
      rows.push({
        sku: sku.toUpperCase(),
        title,
        category,
        subcategory,
        tags,
        color,
        size,
        price,
        promotional_price: promoPrice,
        cost_price: cost,
        stock_quantity: stock,
        allow_backorder: backorder,
        description: desc,
        image_url: img,
      });
    }
  });

  return { rows, rawErrors, ignoredEmptyCount };
}

export async function POST(req: NextRequest) {
  try {
    let rowsToImport: CSVRowData[] = [];
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo de planilha enviado.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const { rows, rawErrors } = parseSpreadsheetBuffer(buffer);
      if (rawErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `A planilha contém ${rawErrors.length} erro(s) de validação.`,
            validationErrors: rawErrors,
          },
          { status: 422 }
        );
      }
      rowsToImport = rows;
    } else {
      const body = await req.json();

      // Caso 1: Client já enviou os itens validados via JSON
      if (Array.isArray(body.items) && body.items.length > 0) {
        rowsToImport = body.items.map((i: any) => ({
          sku: String(i.sku || '').trim().toUpperCase(),
          title: String(i.title || '').trim(),
          category: String(i.category || '').trim(),
          subcategory: i.subcategory || 'Geral',
          tags: i.tags || '',
          color: String(i.color || '').trim(),
          size: String(i.size || '').trim(),
          price: parseCurrency(i.price),
          promotional_price: i.promotional_price !== null && i.promotional_price !== undefined ? parseCurrency(i.promotional_price) : null,
          cost_price: parseCurrency(i.cost_price),
          stock_quantity: parseInt(i.stock_quantity) || 0,
          allow_backorder: i.allow_backorder !== false && String(i.allow_backorder) !== 'false',
          description: String(i.description || '').trim(),
          image_url: String(i.image_url || '').trim(),
        }));
      } else if (body.csvText) {
        // Caso 2: Texto CSV enviado
        const buffer = Buffer.from(body.csvText, 'utf8');
        const { rows, rawErrors } = parseSpreadsheetBuffer(buffer);
        if (rawErrors.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `A planilha contém ${rawErrors.length} erro(s) de validação.`,
              validationErrors: rawErrors,
            },
            { status: 422 }
          );
        }
        rowsToImport = rows;
      }
    }

    if (rowsToImport.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum produto válido foi encontrado para importação.' },
        { status: 400 }
      );
    }

    // 1. Mapeamento / Criação Automática de Categorias no Supabase
    const { data: existingCategories } = await supabaseServer
      .from('categories')
      .select('id, name, slug');

    const categoryMap = new Map<string, string>();
    (existingCategories || []).forEach((c: any) => {
      categoryMap.set(c.name.toLowerCase().trim(), c.id);
      categoryMap.set(c.slug.toLowerCase().trim(), c.id);
    });

    const uniqueCategories = Array.from(new Set(rowsToImport.map((r) => r.category.trim()))).filter(Boolean);

    for (const catName of uniqueCategories) {
      const lower = catName.toLowerCase().trim();
      if (!categoryMap.has(lower)) {
        const catSlug = lower
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

        const { data: newCat, error: insertCatErr } = await supabaseServer
          .from('categories')
          .insert([{ name: catName, slug: catSlug }])
          .select('id, name')
          .single();

        if (!insertCatErr && newCat) {
          categoryMap.set(lower, newCat.id);
        }
      }
    }

    // 2. Agrupamento por Produto (Título)
    const productGroups = new Map<string, CSVRowData[]>();
    for (const r of rowsToImport) {
      const key = r.title;
      if (!productGroups.has(key)) {
        productGroups.set(key, []);
      }
      productGroups.get(key)!.push(r);
    }

    let productsCreated = 0;
    let productsUpdated = 0;
    let variantsCreated = 0;
    let variantsUpdated = 0;

    // 3. Processamento Atômico de Produtos e Matrizes SKU
    for (const [prodTitle, prodRows] of Array.from(productGroups.entries())) {
      const firstRow = prodRows[0];
      const prodSlug = prodTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `prod-${Date.now()}`;

      const categoryId = categoryMap.get(firstRow.category.toLowerCase().trim()) || null;

      // Monta tags e metadados estruturados
      const tagsArray = firstRow.tags
        ? firstRow.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const metadataPayload = {
        bio: firstRow.description || `${prodTitle} - Coleção Ana Fitness Wear`,
        composition: '88% Poliamida, 12% Elastano 4-way stretch',
        sizeGuide: 'P (US 2-4), M (US 6-8), G (US 10-12), GG (US 14)',
        tags: tagsArray,
        subcategory: firstRow.subcategory || 'Geral',
        promotional_price: firstRow.promotional_price || null,
      };

      const structuredDescription = JSON.stringify(metadataPayload);

      // Procura produto existente por slug ou title
      const { data: existingProd } = await supabaseServer
        .from('products')
        .select('id, title, slug')
        .or(`slug.eq.${prodSlug},title.eq.${prodTitle}`)
        .maybeSingle();

      let targetProductId = '';

      if (existingProd) {
        targetProductId = existingProd.id;
        const { error: updErr } = await supabaseServer
          .from('products')
          .update({
            title: prodTitle,
            description: structuredDescription,
            category_id: categoryId,
          })
          .eq('id', targetProductId);

        if (!updErr) productsUpdated++;
      } else {
        const { data: newProd, error: insErr } = await supabaseServer
          .from('products')
          .insert([
            {
              title: prodTitle,
              slug: prodSlug,
              description: structuredDescription,
              category_id: categoryId,
            },
          ])
          .select('id')
          .single();

        if (insErr || !newProd) {
          console.error(`Erro ao criar produto "${prodTitle}":`, insErr);
          continue;
        }
        targetProductId = newProd.id;
        productsCreated++;
      }

      // Processa cada variação deste produto
      for (const row of prodRows) {
        // Se image_url estiver vazia, armazena array vazio permitindo inserção posterior
        const imageArray = row.image_url && row.image_url.trim().length > 0
          ? [row.image_url.trim()]
          : [];

        const { data: existingVariant } = await supabaseServer
          .from('product_variants')
          .select('id, images')
          .eq('sku', row.sku)
          .maybeSingle();

        const variantPayload: any = {
          product_id: targetProductId,
          sku: row.sku,
          size: row.size,
          color: row.color,
          price: row.price,
          cost_price: row.cost_price,
          stock_quantity: row.stock_quantity,
          allow_backorder: row.allow_backorder,
          estimated_production_days: 7,
          barcode: `${Date.now()}`.slice(-12),
        };

        if (existingVariant) {
          if (imageArray.length > 0) {
            variantPayload.images = imageArray;
          }

          const { error: updVarErr } = await supabaseServer
            .from('product_variants')
            .update(variantPayload)
            .eq('id', existingVariant.id);

          if (!updVarErr) variantsUpdated++;
        } else {
          variantPayload.images = imageArray;

          const { error: insVarErr } = await supabaseServer
            .from('product_variants')
            .insert([variantPayload]);

          if (!insVarErr) variantsCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Importação em massa concluída com sucesso no Supabase!',
      summary: {
        totalRows: rowsToImport.length,
        productsCreated,
        productsUpdated,
        variantsCreated,
        variantsUpdated,
      },
    });
  } catch (err: any) {
    console.error('Erro na rota de importação de planilha:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no processamento da planilha' }, { status: 500 });
  }
}
