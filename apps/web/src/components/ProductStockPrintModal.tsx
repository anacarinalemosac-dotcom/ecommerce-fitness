'use client';

import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
  Calendar,
  DollarSign,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { sortVariantsByColorAndSize, sortSizesList } from '../lib/variantSortUtils';

export interface ProductStockPrintItem {
  id?: string;
  title: string;
  slug?: string;
  sku?: string;
  category?: string;
  price?: number | string;
  cost_price?: number | string;
  primary_image?: string;
  primaryImage?: string;
  images?: string[];
  stock?: number;
  variants?: Array<{
    id?: string;
    sku?: string;
    color?: string;
    colorHex?: string;
    size?: string;
    stock_quantity?: number;
    stock?: number;
    price?: number;
    cost_price?: number;
    barcode?: string;
    image?: string;
  }>;
  sizes?: string[];
  colors?: Array<{ name: string; hex?: string }>;
  meta?: any;
  description?: string;
}

export interface NormalizedVariant {
  id?: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string;
  stock_quantity: number;
  price: number;
  cost_price: number;
  barcode: string;
  image: string;
}

interface ProductStockPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductStockPrintItem | null;
  allProducts?: ProductStockPrintItem[];
}

export function ProductStockPrintModal({
  isOpen,
  onClose,
  product,
  allProducts = [],
}: ProductStockPrintModalProps) {
  const [includeSimilar, setIncludeSimilar] = useState(false);

  // Normaliza o produto e extrai variantes
  const normalizedData = useMemo(() => {
    if (!product) return null;

    // Se o produto veio do Supabase bruto com JSON em description
    let parsedMeta: any = {};
    if (typeof product.description === 'string' && product.description.trim().startsWith('{')) {
      try {
        parsedMeta = JSON.parse(product.description);
      } catch (_) {}
    } else if (product.meta) {
      parsedMeta = product.meta;
    }

    const rawVariants =
      (Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : null) ||
      (Array.isArray(parsedMeta.variants) && parsedMeta.variants.length > 0 ? parsedMeta.variants : null) ||
      [];

    let normalizedVariants: NormalizedVariant[] = rawVariants.map((v: any) => ({
      id: v.id,
      sku: v.sku || `${product.sku || 'PROD'}-${v.size || 'U'}`,
      color: (v.color || parsedMeta.colorName || 'Padrão').trim(),
      colorHex: v.colorHex || '#0A0A0A',
      size: String(v.size || 'M').trim().toUpperCase(),
      stock_quantity: Number(v.stock_quantity !== undefined ? v.stock_quantity : v.stock !== undefined ? v.stock : 0) || 0,
      price: Number(v.price || product.price || 0),
      cost_price: Number(v.cost_price || product.cost_price || 0),
      barcode: v.barcode || '',
      image: v.image || (Array.isArray(v.images) ? v.images[0] : '') || '',
    }));

    // Se não tinha variantes estruturadas, cria a partir de sizes ou estoque geral
    if (normalizedVariants.length === 0) {
      const sizes = product.sizes || parsedMeta.sizes || ['U'];
      const color = product.colors?.[0]?.name || parsedMeta.colorName || 'Padrão';
      const colorHex = product.colors?.[0]?.hex || '#0A0A0A';
      const eachStock = Math.max(0, Math.round((Number(product.stock) || 0) / sizes.length));

      normalizedVariants = sizes.map((sz: string) => ({
        sku: `${product.sku || 'PROD'}-${sz}`,
        color,
        colorHex,
        size: sz.toUpperCase(),
        stock_quantity: eachStock,
        price: Number(product.price || 0),
        cost_price: Number(product.cost_price || 0),
        barcode: '',
        image: '',
      }));
    }

    // Ordena variantes estritamente por cor e tamanho (PP, P, M, G, GG)
    const sortedVariants: NormalizedVariant[] = sortVariantsByColorAndSize<NormalizedVariant>(normalizedVariants);

    // Produtos similares (mesma família, ex: "Conjunto Bicolor")
    const searchTerms = product.title
      .toLowerCase()
      .split(' ')
      .filter((w) => w.length > 3 && !['para', 'com', 'alta', 'fitness', 'wear'].includes(w));

    const similarList = allProducts.filter((p) => {
      if (p.id === product.id) return false;
      const t = p.title.toLowerCase();
      return searchTerms.some((term) => t.includes(term));
    });

    // Cores únicas
    const uniqueColorsMap = new Map<string, string>();
    sortedVariants.forEach((v) => {
      if (!uniqueColorsMap.has(v.color.toLowerCase())) {
        uniqueColorsMap.set(v.color.toLowerCase(), v.color);
      }
    });
    const uniqueColors = Array.from(uniqueColorsMap.values());

    // Tamanhos únicos ordenados
    const uniqueSizesSet = new Set<string>();
    sortedVariants.forEach((v) => uniqueSizesSet.add(v.size));
    const uniqueSizes = sortSizesList(Array.from(uniqueSizesSet));

    // Matriz de estoque [Cor][Tamanho] = Quantidade
    const matrix: Record<string, Record<string, number>> = {};
    const colorTotals: Record<string, number> = {};
    const sizeTotals: Record<string, number> = {};

    uniqueColors.forEach((c) => {
      matrix[c] = {};
      colorTotals[c] = 0;
      uniqueSizes.forEach((sz) => {
        matrix[c][sz] = 0;
        if (!sizeTotals[sz]) sizeTotals[sz] = 0;
      });
    });

    sortedVariants.forEach((v) => {
      const c = v.color;
      const sz = v.size;
      const qty = v.stock_quantity;
      if (matrix[c]) {
        matrix[c][sz] = (matrix[c][sz] || 0) + qty;
      }
      colorTotals[c] = (colorTotals[c] || 0) + qty;
      sizeTotals[sz] = (sizeTotals[sz] || 0) + qty;
    });

    const totalPieces = sortedVariants.reduce((acc, v) => acc + v.stock_quantity, 0);
    const totalInStockVariants = sortedVariants.filter((v) => v.stock_quantity > 0).length;
    const totalOutOfStockVariants = sortedVariants.filter((v) => v.stock_quantity <= 0).length;

    const prodPrice = Number(product.price || parsedMeta.price || 49.90);
    const prodCost = Number(product.cost_price || parsedMeta.cost_price || 12.00);
    const prodImage =
      product.primary_image ||
      product.primaryImage ||
      parsedMeta.primary_image ||
      (Array.isArray(product.images) ? product.images[0] : '') ||
      sortedVariants[0]?.image ||
      '';

    return {
      product,
      title: product.title,
      category: product.category || parsedMeta.category || 'Conjuntos',
      sku: product.sku || parsedMeta.sku || sortedVariants[0]?.sku || 'S/ SKU',
      price: prodPrice,
      cost_price: prodCost,
      image: prodImage,
      variants: sortedVariants,
      uniqueColors,
      uniqueSizes,
      matrix,
      colorTotals,
      sizeTotals,
      totalPieces,
      totalInStockVariants,
      totalOutOfStockVariants,
      similarList,
    };
  }, [product, allProducts]);

  if (!isOpen || !normalizedData) return null;

  // Função que abre a janela de impressão nativa formatada em A4
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups no seu navegador para abrir a ficha de impressão.');
      return;
    }

    const {
      title,
      category,
      sku,
      price,
      cost_price,
      image,
      variants,
      uniqueColors,
      uniqueSizes,
      matrix,
      colorTotals,
      sizeTotals,
      totalPieces,
      totalInStockVariants,
      totalOutOfStockVariants,
    } = normalizedData;

    const formattedDate = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/New_York',
      dateStyle: 'short',
      timeStyle: 'short',
    });

    // Gera linhas da matriz Cor x Tamanho
    const matrixHeaderHtml = uniqueSizes.map((sz) => `<th style="width: 50px; text-align: center;">${sz}</th>`).join('');
    const matrixRowsHtml = uniqueColors
      .map((c) => {
        const cells = uniqueSizes
          .map((sz) => {
            const qty = matrix[c]?.[sz] || 0;
            const bg = qty > 0 ? '#fff' : '#fef2f2';
            const colorText = qty > 0 ? '#111' : '#991b1b';
            const bold = qty > 0 ? 'font-weight: 700;' : 'font-weight: 400; opacity: 0.6;';
            return `<td style="text-align: center; background: ${bg}; color: ${colorText}; ${bold}">${qty}</td>`;
          })
          .join('');

        const rowTotal = colorTotals[c] || 0;
        return `
        <tr>
          <td style="font-weight: 700; text-transform: uppercase;">${c}</td>
          ${cells}
          <td style="text-align: center; font-weight: 800; background: #fafafa;">${rowTotal} un</td>
        </tr>
      `;
      })
      .join('');

    const sizeTotalsCellsHtml = uniqueSizes
      .map((sz) => `<td style="text-align: center; font-weight: 800; background: #fafafa;">${sizeTotals[sz] || 0}</td>`)
      .join('');

    // Gera linhas detalhadas da lista de conferência física
    const checklistRowsHtml = variants
      .map((v, idx) => {
        const isOutOfStock = v.stock_quantity <= 0;
        const statusBadge = isOutOfStock
          ? `<span style="color: #991b1b; font-weight: 700; font-size: 9px; padding: 2px 6px; background: #fee2e2; border-radius: 2px;">ESGOTADO</span>`
          : `<span style="color: #166534; font-weight: 700; font-size: 9px; padding: 2px 6px; background: #dcfce7; border-radius: 2px;">DISPONÍVEL</span>`;

        return `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fbfbfb'};">
          <td style="text-align: center; font-weight: 800; font-size: 10px; color: #666;">${idx + 1}</td>
          <td style="font-weight: 700; text-transform: uppercase;">${v.color}</td>
          <td style="text-align: center; font-weight: 900; font-size: 12px; background: #f4f4f5;">${v.size}</td>
          <td style="font-family: monospace; font-size: 10px; color: #444;">${v.sku}</td>
          <td style="text-align: center; font-weight: 900; font-size: 13px; color: ${isOutOfStock ? '#dc2626' : '#111827'};">
            ${v.stock_quantity} un
          </td>
          <td style="text-align: center;">${statusBadge}</td>
          <td style="text-align: center; border-left: 2px dashed #bbb; background: #fff;">
            <div style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #333; margin-right: 6px; vertical-align: middle;"></div>
            <span style="border-bottom: 1px dotted #333; display: inline-block; width: 45px; height: 14px;"></span>
          </td>
          <td style="font-size: 9px; color: #777;">
            <span style="border-bottom: 1px dotted #ccc; display: block; width: 100%; height: 14px;"></span>
          </td>
        </tr>
      `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Conferência de Estoque - ${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #111;
              background: #fff;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.35;
            }

            .no-print-bar {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: #0a0a0a;
              color: #fff;
              padding: 12px 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 9999;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .no-print-bar button {
              cursor: pointer;
              font-weight: 800;
              text-transform: uppercase;
              padding: 8px 18px;
              border-radius: 4px;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            .btn-print {
              background: #D4AF37;
              color: #000;
              border: 0;
              margin-right: 8px;
            }
            .btn-close {
              background: transparent;
              color: #fff;
              border: 1px solid #444;
            }

            .page-container {
              padding-top: 55px;
            }

            @media print {
              .no-print-bar { display: none !important; }
              .page-container { padding-top: 0 !important; }
              body { font-size: 10px; }
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .brand-name {
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #000;
            }
            .sheet-title {
              font-size: 12px;
              font-weight: 800;
              color: #b45309;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 2px;
            }
            .meta-box {
              text-align: right;
              font-size: 9px;
              color: #555;
            }

            .product-card {
              display: flex;
              align-items: center;
              gap: 16px;
              background: #f8f8f8;
              border: 1px solid #e5e5e5;
              padding: 10px 14px;
              border-radius: 4px;
              margin-bottom: 14px;
            }
            .product-img {
              width: 58px;
              height: 72px;
              object-fit: cover;
              border: 1px solid #ccc;
              border-radius: 3px;
              background: #fff;
            }
            .product-details {
              flex: 1;
            }
            .product-title {
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
              color: #000;
              margin: 0 0 3px 0;
            }
            .product-badges {
              display: flex;
              gap: 14px;
              font-size: 10px;
              color: #444;
            }
            .product-stock-pill {
              background: #000;
              color: #D4AF37;
              padding: 8px 14px;
              border-radius: 4px;
              text-align: center;
              font-weight: 900;
            }
            .product-stock-pill .num {
              font-size: 20px;
              display: block;
              line-height: 1;
              color: #fff;
            }
            .product-stock-pill .lbl {
              font-size: 8px;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-top: 2px;
            }

            .section-heading {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #000;
              margin: 14px 0 6px 0;
              display: flex;
              justify-content: space-between;
              align-items: baseline;
            }
            .section-heading .hint {
              font-size: 9px;
              font-weight: 400;
              color: #666;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 10px;
            }
            th, td {
              border: 1px solid #d4d4d8;
              padding: 5px 7px;
            }
            th {
              background: #e4e4e7;
              color: #000;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.5px;
            }

            .footer-audit {
              margin-top: 18px;
              padding-top: 12px;
              border-top: 2px solid #000;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              font-size: 10px;
              page-break-inside: avoid;
            }
            .sign-line {
              margin-top: 26px;
              border-bottom: 1px solid #000;
              width: 90%;
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <div>
              <span style="font-weight: 900; color: #D4AF37;">ANA FITNESS WEAR</span>
              <span style="color: #aaa; margin-left: 8px;">— Visualização Prévia para Impressão</span>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">🖨️ Imprimir Agora (A4)</button>
              <button class="btn-close" onclick="window.close()">✕ Fechar</button>
            </div>
          </div>

          <div class="page-container">
            <!-- Cabeçalho Oficial -->
            <div class="header">
              <div>
                <div class="brand-name">ANA FITNESS WEAR LLC</div>
                <div class="sheet-title">📋 FICHA DE AUDITORIA E CONFERÊNCIA DE ESTOQUE FÍSICO</div>
              </div>
              <div class="meta-box">
                <div><strong>Data/Hora:</strong> ${formattedDate} (EST)</div>
                <div><strong>Ambiente:</strong> Backoffice Oficial</div>
                <div><strong>Doc:</strong> INV-${sku}</div>
              </div>
            </div>

            <!-- Card Resumo do Produto -->
            <div class="product-card">
              ${image ? `<img src="${image}" class="product-img" alt="${title}" onerror="this.style.display='none'" />` : ''}
              <div class="product-details">
                <h1 class="product-title">${title}</h1>
                <div class="product-badges">
                  <div><strong>Categoria:</strong> ${category}</div>
                  <div><strong>SKU Base:</strong> ${sku}</div>
                  <div><strong>Preço Venda:</strong> $${price.toFixed(2)}</div>
                  <div><strong>Custo Unit:</strong> $${cost_price.toFixed(2)}</div>
                  <div><strong>Cores:</strong> ${uniqueColors.length}</div>
                </div>
              </div>
              <div class="product-stock-pill">
                <span class="num">${totalPieces}</span>
                <span class="lbl">PEÇAS TOTAL</span>
              </div>
            </div>

            <!-- Matriz Resumo por Cor x Tamanho -->
            <div class="section-heading">
              <span>1. GRADE RESUMO RÁPIDO (MATRIZ COR × TAMANHO)</span>
              <span class="hint">Visão geral consolidada para conferência rápida</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">COR</th>
                  ${matrixHeaderHtml}
                  <th style="width: 70px; text-align: center; background: #d4d4d8;">TOTAL COR</th>
                </tr>
              </thead>
              <tbody>
                ${matrixRowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td style="font-weight: 800; background: #fafafa; text-transform: uppercase;">TOTAL POR TAMANHO</td>
                  ${sizeTotalsCellsHtml}
                  <td style="text-align: center; font-weight: 900; background: #000; color: #fff; font-size: 11px;">
                    ${totalPieces} un
                  </td>
                </tr>
              </tfoot>
            </table>

            <!-- Lista Completa para Vistoria Física na Arara / Prateleira -->
            <div class="section-heading" style="margin-top: 14px;">
              <span>2. RELAÇÃO COMPLETA PARA CONFERÊNCIA FÍSICA (CHECKLIST ARARA / GAVETA)</span>
              <span class="hint">Marque [✓] à caneta ao contar as peças físicas</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 25px; text-align: center;">#</th>
                  <th style="text-align: left;">COR</th>
                  <th style="width: 45px; text-align: center;">TAM</th>
                  <th style="text-align: left;">SKU VARIANTE</th>
                  <th style="width: 80px; text-align: center;">ESTOQUE SISTEMA</th>
                  <th style="width: 80px; text-align: center;">STATUS</th>
                  <th style="width: 85px; text-align: center; border-left: 2px dashed #999;">CONTAGEM FÍSICA</th>
                  <th style="width: 120px; text-align: left;">OBSERVAÇÕES</th>
                </tr>
              </thead>
              <tbody>
                ${checklistRowsHtml}
              </tbody>
            </table>

            <!-- Bloco de Assinatura e Fechamento da Auditoria -->
            <div class="footer-audit">
              <div>
                <strong style="text-transform: uppercase;">RESPONSÁVEL PELA CONTAGEM FÍSICA:</strong>
                <div class="sign-line"></div>
                <div style="font-size: 9px; color: #666; margin-top: 4px;">Nome da Conferente / Vendedora</div>
                <div style="margin-top: 8px;">
                  <strong>Data da Vistoria:</strong> _____ / _____ / 2026
                </div>
              </div>

              <div>
                <strong style="text-transform: uppercase;">RESULTADO DA AUDITORIA:</strong>
                <div style="margin-top: 6px;">
                  <label style="display: block; margin-bottom: 4px;">
                    [ &nbsp; ] <strong>ESTOQUE 100% EXATO</strong> (Contagem física bate exatamente com o sistema)
                  </label>
                  <label style="display: block; margin-bottom: 4px;">
                    [ &nbsp; ] <strong>DIVERGÊNCIA IDENTIFICADA</strong> (Ajustar quantidade no Backoffice)
                  </label>
                  <label style="display: block;">
                    [ &nbsp; ] <strong>PEÇA AVARIADA / RETIRADA</strong>
                  </label>
                </div>
              </div>
            </div>

            <div style="margin-top: 14px; font-size: 8px; color: #888; text-align: center; border-top: 1px dotted #ccc; padding-top: 6px;">
              Ana Fitness Wear LLC • Leominster, Massachusetts • Ficha gerada para conferência de estoque físico e auditoria interna.
            </div>
          </div>

          <script>
            // Aciona a impressão automaticamente ao carregar a página
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const {
    title,
    category,
    sku,
    price,
    variants,
    uniqueColors,
    uniqueSizes,
    matrix,
    colorTotals,
    sizeTotals,
    totalPieces,
    similarList,
  } = normalizedData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border-2 border-deep-black shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-4 bg-deep-black text-white flex items-center justify-between shrink-0 border-b-2 border-gold">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gold text-deep-black rounded-xs">
              <Printer className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                AUDITORIA DE ESTOQUE • FICHA DE CONFERÊNCIA
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white truncate max-w-[500px]">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md cursor-pointer border border-gold"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>IMPRIMIR AGORA (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Info Bar */}
        <div className="px-5 py-3 bg-neutral-100 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-neutral-500 font-bold uppercase text-[10px]">SKU:</span>{' '}
              <span className="font-mono font-bold text-black">{sku}</span>
            </div>
            <div>
              <span className="text-neutral-500 font-bold uppercase text-[10px]">Categoria:</span>{' '}
              <span className="font-bold text-black uppercase">{category}</span>
            </div>
            <div>
              <span className="text-neutral-500 font-bold uppercase text-[10px]">Preço:</span>{' '}
              <span className="font-bold text-emerald-700">${price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-neutral-500 font-bold uppercase text-[10px]">Cores:</span>{' '}
              <span className="font-bold text-black">{uniqueColors.length} opções</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-neutral-600">Total em Estoque:</span>
            <span className="px-3 py-0.5 bg-deep-black text-gold font-black text-sm rounded-xs border border-gold/40">
              {totalPieces} peças
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Matriz Cor x Tamanho */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-black uppercase tracking-wider text-deep-black text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gold" />
                1. Grade Resumo por Cor & Tamanho (Matriz Rápida)
              </span>
              <span className="text-[10px] text-neutral-500">PP, P, M, G, GG em ordem</span>
            </div>

            <div className="border border-neutral-300 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-200 text-deep-black uppercase text-[10px] font-black border-b border-neutral-300">
                    <th className="p-2 border-r border-neutral-300">Cor</th>
                    {uniqueSizes.map((sz) => (
                      <th key={sz} className="p-2 text-center border-r border-neutral-300 w-16">
                        {sz}
                      </th>
                    ))}
                    <th className="p-2 text-center bg-neutral-300 w-24">Total Cor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-medium">
                  {uniqueColors.map((c) => (
                    <tr key={c} className="hover:bg-neutral-50">
                      <td className="p-2 font-bold uppercase text-black border-r border-neutral-200">
                        {c}
                      </td>
                      {uniqueSizes.map((sz) => {
                        const qty = matrix[c]?.[sz] || 0;
                        return (
                          <td
                            key={sz}
                            className={`p-2 text-center border-r border-neutral-200 font-bold ${
                              qty > 0 ? 'text-black' : 'text-neutral-300 font-normal'
                            }`}
                          >
                            {qty}
                          </td>
                        );
                      })}
                      <td className="p-2 text-center font-black bg-neutral-100 text-black">
                        {colorTotals[c] || 0} un
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-200 font-black text-deep-black border-t-2 border-neutral-300 uppercase text-[10px]">
                    <td className="p-2 border-r border-neutral-300">TOTAL TAMANHO</td>
                    {uniqueSizes.map((sz) => (
                      <td key={sz} className="p-2 text-center border-r border-neutral-300">
                        {sizeTotals[sz] || 0}
                      </td>
                    ))}
                    <td className="p-2 text-center bg-deep-black text-gold font-black text-xs">
                      {totalPieces} un
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Checklist de Peças Detalhado */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-black uppercase tracking-wider text-deep-black text-xs flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-gold" />
                2. Relação Completa para Conferência de Arara (Checklist)
              </span>
              <span className="text-[10px] text-neutral-500">
                {variants.length} variações cadastradas
              </span>
            </div>

            <div className="border border-neutral-300 overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-neutral-200 text-deep-black uppercase text-[10px] font-black border-b border-neutral-300 shadow-xs">
                  <tr>
                    <th className="p-2 w-8 text-center border-r border-neutral-300">#</th>
                    <th className="p-2 border-r border-neutral-300">Cor</th>
                    <th className="p-2 text-center border-r border-neutral-300 w-12">Tam</th>
                    <th className="p-2 border-r border-neutral-300">SKU</th>
                    <th className="p-2 text-center border-r border-neutral-300 w-24">Estoque</th>
                    <th className="p-2 text-center border-r border-neutral-300 w-24">Status</th>
                    <th className="p-2 text-center w-28 bg-warm-light/40">Visto Conferência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {variants.map((v, i) => {
                    const isZero = v.stock_quantity <= 0;
                    return (
                      <tr key={i} className={isZero ? 'bg-red-50/40' : 'hover:bg-neutral-50'}>
                        <td className="p-2 text-center text-neutral-400 font-mono text-[10px] border-r border-neutral-200">
                          {i + 1}
                        </td>
                        <td className="p-2 font-bold uppercase text-black border-r border-neutral-200">
                          {v.color}
                        </td>
                        <td className="p-2 text-center font-black text-black bg-neutral-100 border-r border-neutral-200">
                          {v.size}
                        </td>
                        <td className="p-2 font-mono text-[11px] text-neutral-600 border-r border-neutral-200">
                          {v.sku}
                        </td>
                        <td className="p-2 text-center font-black text-sm border-r border-neutral-200">
                          <span className={isZero ? 'text-red-600' : 'text-emerald-700'}>
                            {v.stock_quantity} un
                          </span>
                        </td>
                        <td className="p-2 text-center border-r border-neutral-200">
                          {isZero ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded-xs">
                              ESGOTADO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-xs">
                              DISPONÍVEL
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center bg-warm-light/20">
                          <div className="inline-block w-3.5 h-3.5 border-2 border-neutral-400 mr-2 align-middle" />
                          <span className="inline-block w-8 border-b border-dotted border-neutral-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-neutral-100 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-neutral-500 text-[11px]">
            💡 <strong>Dica:</strong> A impressão gera uma folha <strong>A4</strong> limpa com cabeçalho oficial e campo de assinatura para conferência física na loja.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border-2 border-neutral-300 hover:border-black font-black uppercase text-xs transition cursor-pointer"
            >
              FECHAR
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-6 py-2 bg-deep-black hover:bg-gold text-white hover:text-deep-black font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-2 border-2 border-deep-black shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-gold group-hover:text-deep-black" />
              <span>IMPRIMIR FICHA DE ESTOQUE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
