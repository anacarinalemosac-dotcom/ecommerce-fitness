import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export interface CSVRowData {
  sku: string;
  title: string;
  category: string;
  subcategory?: string;
  tags?: string;
  color: string;
  size: string;
  price: number;
  promotional_price?: number;
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

// Tokenizador seguro de CSV que respeita aspas duplas e vírgulas/ponto-e-vírgulas internas
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // pula aspa escapada
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

function parseCSV(csvText: string): { rows: CSVRowData[]; rawErrors: ValidationError[] } {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      rawErrors: [{ row: 0, field: 'file', message: 'O arquivo CSV precisa ter cabeçalho e pelo menos 1 linha de dados.' }],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map((h) =>
    h.toLowerCase().replace(/["\s_-]/g, '')
  );

  const getCol = (cols: string[], possibleNames: string[]): string => {
    for (const name of possibleNames) {
      const idx = headers.indexOf(name.toLowerCase().replace(/["\s_-]/g, ''));
      if (idx !== -1 && cols[idx] !== undefined) {
        return cols[idx].replace(/^"|"$/g, '').trim();
      }
    }
    return '';
  };

  const rows: CSVRowData[] = [];
  const rawErrors: ValidationError[] = [];
  const seenSkus = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const cols = parseCSVLine(lines[i], delimiter);

    const sku = getCol(cols, ['sku', 'codigo', 'cod']);
    const title = getCol(cols, ['title', 'titulo', 'nome', 'produto', 'product']);
    const category = getCol(cols, ['category', 'categoria']);
    const subcategory = getCol(cols, ['subcategory', 'subcategoria']);
    const tags = getCol(cols, ['tags', 'tag', 'etiquetas']);
    const color = getCol(cols, ['color', 'cor']);
    const size = getCol(cols, ['size', 'tamanho', 'tam']);
    const priceRaw = getCol(cols, ['price', 'preco', 'precoregular', 'regularprice', 'valordevenda', 'valor']);
    const promoRaw = getCol(cols, ['promotionalprice', 'precopromocional', 'saleprice', 'promocional', 'desconto']);
    const costRaw = getCol(cols, ['costprice', 'precocusto', 'custo', 'cost']);
    const stockRaw = getCol(cols, ['stockquantity', 'stock', 'estoque', 'quantidade', 'qty']);
    const backorderRaw = getCol(cols, ['allowbackorder', 'backorder', 'encomenda', 'prevenda', 'permiteencomenda']);
    const description = getCol(cols, ['description', 'descricao', 'detalhes', 'bio']);
    const imageUrl = getCol(cols, ['imageurl', 'image', 'imagem', 'foto', 'urlimagem']);

    // 1. Validação de SKU
    if (!sku) {
      rawErrors.push({ row: lineNum, field: 'sku', message: `Linha ${lineNum}: SKU é obrigatório.` });
    } else if (seenSkus.has(sku.toUpperCase())) {
      rawErrors.push({ row: lineNum, sku, field: 'sku', message: `Linha ${lineNum}: SKU "${sku}" duplicado dentro do mesmo CSV.` });
    } else {
      seenSkus.add(sku.toUpperCase());
    }

    // 2. Validação de Título
    if (!title) {
      rawErrors.push({ row: lineNum, sku, field: 'title', message: `Linha ${lineNum}: Nome/Título do produto é obrigatório.` });
    }

    // 3. Validação de Categoria e Subcategoria
    if (!category) {
      rawErrors.push({ row: lineNum, sku, field: 'category', message: `Linha ${lineNum}: Categoria é obrigatória.` });
    }

    // 4. Validação de Cor e Tamanho
    if (!color) {
      rawErrors.push({ row: lineNum, sku, field: 'color', message: `Linha ${lineNum}: Cor da variação é obrigatória.` });
    }
    if (!size) {
      rawErrors.push({ row: lineNum, sku, field: 'size', message: `Linha ${lineNum}: Tamanho da variação é obrigatório.` });
    }

    // 5. Validação de Preço Regular
    const parsedPrice = parseFloat(priceRaw.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      rawErrors.push({ row: lineNum, sku, field: 'price', message: `Linha ${lineNum}: Preço regular de venda deve ser um número maior que zero (ex: 44.90).` });
    }

    // 6. Validação de Preço de Custo
    const parsedCost = parseFloat(costRaw.replace(',', '.'));
    if (isNaN(parsedCost) || parsedCost < 0) {
      rawErrors.push({ row: lineNum, sku, field: 'cost_price', message: `Linha ${lineNum}: Preço de custo é obrigatório e deve ser >= 0 (ex: 16.00).` });
    }

    // 7. Preço Promocional (Opcional, mas se preenchido deve ser numérico)
    let parsedPromo: number | undefined = undefined;
    if (promoRaw) {
      const p = parseFloat(promoRaw.replace(',', '.'));
      if (!isNaN(p) && p > 0) {
        parsedPromo = p;
      }
    }

    // 8. Estoque
    const parsedStock = parseInt(stockRaw, 10);
    const finalStock = isNaN(parsedStock) || parsedStock < 0 ? 0 : parsedStock;

    // 9. Permite Encomenda (Backorder)
    const finalBackorder =
      backorderRaw.toLowerCase() === 'true' ||
      backorderRaw.toLowerCase() === 'sim' ||
      backorderRaw.toLowerCase() === '1' ||
      backorderRaw.toLowerCase() === 'yes' ||
      backorderRaw === '';

    rows.push({
      sku: sku.toUpperCase(),
      title: title.toUpperCase(),
      category: category.trim().toUpperCase(),
      subcategory: subcategory ? subcategory.trim() : 'Geral',
      tags: tags ? tags.trim() : '',
      color: color.trim(),
      size: size.trim().toUpperCase(),
      price: parsedPrice,
      promotional_price: parsedPromo,
      cost_price: parsedCost,
      stock_quantity: finalStock,
      allow_backorder: finalBackorder,
      description: description.trim(),
      image_url: imageUrl ? imageUrl.trim() : '',
    });
  }

  return { rows, rawErrors };
}

export async function POST(req: NextRequest) {
  try {
    let csvText = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo CSV enviado.' }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await req.json();
      csvText = body.csvText || '';
    }

    if (!csvText || !csvText.trim()) {
      return NextResponse.json({ error: 'Conteúdo do CSV está vazio.' }, { status: 400 });
    }

    // 1. Parsing e Validação Obrigatória
    const { rows, rawErrors } = parseCSV(csvText);

    if (rawErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `O arquivo contém ${rawErrors.length} erro(s) de validação. Corrija o arquivo antes de importar.`,
          validationErrors: rawErrors,
          totalRows: rows.length + rawErrors.length,
        },
        { status: 422 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Nenhuma linha válida encontrada no CSV.' }, { status: 400 });
    }

    // 2. Mapeamento de Categorias no Supabase
    const { data: existingCategories, error: catFetchErr } = await supabaseServer
      .from('categories')
      .select('*');

    if (catFetchErr) {
      console.warn('Aviso ao carregar categorias do Supabase:', catFetchErr);
    }

    const categoryMap = new Map<string, string>(); // categoryNameUpper -> category_id UUID
    (existingCategories || []).forEach((c) => {
      categoryMap.set(c.name.trim().toUpperCase(), c.id);
      categoryMap.set(c.slug.trim().toLowerCase(), c.id);
    });

    // Cria categorias faltantes automaticamente
    const uniqueCategories = Array.from(new Set(rows.map((r) => r.category)));
    for (const catName of uniqueCategories) {
      if (!categoryMap.has(catName)) {
        const catSlug = catName
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const { data: newCat, error: insertCatErr } = await supabaseServer
          .from('categories')
          .insert([{ name: catName, slug: catSlug }])
          .select('id, name')
          .single();

        if (!insertCatErr && newCat) {
          categoryMap.set(catName, newCat.id);
        }
      }
    }

    // 3. Agrupamento por Produto (Título)
    // No e-commerce, cada produto pode ter múltiplas variações de cores e tamanhos
    const productGroups = new Map<string, CSVRowData[]>();
    for (const r of rows) {
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

    // 4. Inserção / Atualização Atômica no Supabase
    for (const [prodTitle, prodRows] of Array.from(productGroups.entries())) {
      const firstRow = prodRows[0];
      const prodSlug = prodTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const categoryId = categoryMap.get(firstRow.category) || null;

      // Monta tags e metadados
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

      // Verifica se o produto já existe no Supabase pelo slug ou title
      const { data: existingProd } = await supabaseServer
        .from('products')
        .select('id, title, slug')
        .or(`slug.eq.${prodSlug},title.eq.${prodTitle}`)
        .maybeSingle();

      let targetProductId = '';

      if (existingProd) {
        // Atualiza produto existente
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
        // Insere novo produto
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
        // Trata imagem: se vazia, array vazio [] permitindo inclusão manual posterior
        const imageArray = row.image_url && row.image_url.trim().length > 0
          ? [row.image_url.trim()]
          : [];

        // Verifica se a variação já existe pelo SKU
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
          // Se image_url veio vazia no CSV, preserva as imagens existentes se já houver, ou mantém vazia
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
        totalRows: rows.length,
        productsCreated,
        productsUpdated,
        variantsCreated,
        variantsUpdated,
      },
    });
  } catch (err: any) {
    console.error('Erro na rota de importação CSV:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no processamento do CSV' }, { status: 500 });
  }
}
