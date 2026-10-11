'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Image as ImageIcon,
  Search,
  Filter,
} from 'lucide-react';

export interface ValidatedProductRow {
  lineNum: number;
  sku: string;
  title: string;
  category: string;
  subcategory: string;
  tags: string;
  color: string;
  size: string;
  price: number;
  promotional_price: number | null;
  cost_price: number;
  stock_quantity: number;
  allow_backorder: boolean;
  description: string;
  image_url: string;
  hasImage: boolean;
}

export interface ValidationErrorItem {
  row: number;
  sku?: string;
  field: string;
  message: string;
}

// Utilitário robusto para converter preços numéricos em dólares
export function parseCurrencyValue(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Number(val.toFixed(2));
  }

  let str = String(val).trim();
  // Remove símbolos monetários ($ ou R$), mantendo apenas dígitos, pontos, vírgulas e traços
  str = str.replace(/[^0-9.,-]/g, '').trim();
  if (!str) return 0;

  // Se tem apenas vírgula (ex: "22,90" ou "5,83"), substitui por ponto
  if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  } else if (str.includes('.') && str.includes(',')) {
    // Ambos existem (ex: "1,250.00" ou "1.250,00")
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

// Normaliza chaves de cabeçalho (remove acentos, espaços, maiúsculas)
function normalizeHeaderKey(key: string): string {
  return String(key || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Gera e faz download do modelo oficial em formato Excel (.xlsx)
export function downloadExcelTemplate() {
  const headers = [
    'sku',
    'title',
    'category',
    'subcategory',
    'tags',
    'color',
    'size',
    'price',
    'promotional_price',
    'cost_price',
    'stock_quantity',
    'allow_backorder',
    'description',
    'image_url',
  ];

  const rows = [
    [
      'SAM-BLK-S',
      'SAMANTA ROMPER',
      'Rompers',
      'High Compression',
      'squat-proof,zero-transparencia',
      'Black Onyx',
      'S',
      44.9,
      39.9,
      16.0,
      10,
      true,
      'Macaquinho modelador com bojo removível e tecido duplo zero transparência.',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    ],
    [
      'SAM-BLK-M',
      'SAMANTA ROMPER',
      'Rompers',
      'High Compression',
      'squat-proof,zero-transparencia',
      'Black Onyx',
      'M',
      44.9,
      39.9,
      16.0,
      15,
      true,
      'Macaquinho modelador com bojo removível e tecido duplo zero transparência.',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    ],
    [
      'TOP-TEL-XS-AZU',
      'TOP Telinha',
      'Tops',
      'Activewear Top',
      'activewear,sporty-style',
      'Blue-Navy',
      'XS',
      22.9,
      12.9,
      5.83,
      8,
      true,
      'Top respirável de alta sustentação ideal para treinos diários e pilates.',
      '', // Deixado vazio de propósito: foto pode ser adicionada depois
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

  XLSX.writeFile(wb, 'modelo_importacao_produtos_ana_fitness.xlsx');
}

// Gera e faz download do modelo em formato CSV (compatibilidade)
export function downloadCsvTemplate() {
  const headers = [
    'sku',
    'title',
    'category',
    'subcategory',
    'tags',
    'color',
    'size',
    'price',
    'promotional_price',
    'cost_price',
    'stock_quantity',
    'allow_backorder',
    'description',
    'image_url',
  ];

  const exampleRows = [
    [
      'SAM-BLK-S',
      'SAMANTA ROMPER',
      'Rompers',
      'High Compression',
      '"squat-proof,zero-transparencia"',
      'Black Onyx',
      'S',
      '44.90',
      '39.90',
      '16.00',
      '10',
      'true',
      '"Macaquinho modelador com bojo removivel e tecido duplo zero transparencia"',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    ],
    [
      'TOP-TEL-XS-AZU',
      'TOP Telinha',
      'Tops',
      'Activewear Top',
      '"activewear,sporty-style"',
      'Blue-Navy',
      'XS',
      '22.90',
      '12.90',
      '5.83',
      '8',
      'true',
      '"Top respiravel de alta sustentacao ideal para treinos diarios"',
      '',
    ],
  ];

  const csvContent =
    '\uFEFF' +
    headers.join(',') +
    '\n' +
    exampleRows.map((r) => r.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'modelo_importacao_produtos_ana_fitness.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface CsvProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (summary: any) => void;
}

export function CsvProductImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CsvProductImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados dos dados validados
  const [validatedRows, setValidatedRows] = useState<ValidatedProductRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);
  const [ignoredEmptyCount, setIgnoredEmptyCount] = useState<number>(0);
  const [uniqueProductsCount, setUniqueProductsCount] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [importSummary, setImportSummary] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setValidationErrors([]);
    setValidatedRows([]);
    setIgnoredEmptyCount(0);
    setImportSummary(null);
    setParsing(true);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);

        // Lê tanto .xlsx, .xls quanto .csv com SheetJS
        const workbook = XLSX.read(data, { type: 'array', raw: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Nenhuma aba ou planilha encontrada no arquivo.');
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converte em array de objetos ignorando linhas em branco do Excel
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          blankrows: false,
          raw: true,
        });

        if (!rawJson || rawJson.length === 0) {
          setValidationErrors([
            {
              row: 0,
              field: 'file',
              message: 'A planilha está vazia ou não contém dados válidos.',
            },
          ]);
          setParsing(false);
          return;
        }

        parseAndValidateRows(rawJson);
      } catch (err: any) {
        console.error('Erro ao ler planilha:', err);
        setValidationErrors([
          {
            row: 0,
            field: 'file',
            message: `Erro ao processar o arquivo: ${err.message || 'Arquivo corrompido ou formato não suportado.'}`,
          },
        ]);
      } finally {
        setParsing(false);
      }
    };

    reader.onerror = () => {
      setValidationErrors([
        { row: 0, field: 'file', message: 'Erro ao carregar o arquivo do seu computador.' },
      ]);
      setParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const parseAndValidateRows = (rawJson: any[]) => {
    const validRows: ValidatedProductRow[] = [];
    const errors: ValidationErrorItem[] = [];
    const seenSkus = new Set<string>();
    let emptyCount = 0;

    rawJson.forEach((row, idx) => {
      const lineNum = idx + 2; // Cabeçalho é a linha 1 no Excel

      // 1. Verifica se a linha é completamente vazia
      const isAllBlank = Object.values(row).every(
        (v) => v === null || v === undefined || String(v).trim() === ''
      );
      if (isAllBlank) {
        emptyCount++;
        return;
      }

      // 2. Normaliza os nomes das colunas
      const rowMap: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        rowMap[normalizeHeaderKey(k)] = v;
      }

      const getVal = (aliases: string[]): any => {
        for (const alias of aliases) {
          const key = normalizeHeaderKey(alias);
          if (rowMap[key] !== undefined && rowMap[key] !== null && String(rowMap[key]).trim() !== '') {
            return rowMap[key];
          }
        }
        return '';
      };

      // 3. Mapeamento robusto com suporte a múltiplos sinônimos em Inglês e Português
      const sku = String(getVal(['sku', 'codigo', 'cod', 'itemcode', 'productcode', 'referencia'])).trim();
      const title = String(getVal(['title', 'titulo', 'nome', 'product', 'produto', 'productname', 'itemname'])).trim();
      const category = String(getVal(['category', 'categoria', 'departamento', 'department', 'tipo', 'type'])).trim();
      const subcategory = String(getVal(['subcategory', 'subcategoria', 'linha', 'sub_category', 'fitnessline'])).trim() || 'Geral';
      const tags = String(getVal(['tags', 'tag', 'palavraschave', 'keywords'])).trim();
      const color = String(getVal(['color', 'cor', 'colour', 'variacaocor'])).trim();
      const size = String(getVal(['size', 'tamanho', 'tam', 'variacaotamanho'])).trim();

      // Mapeamento de preços garantindo que regular e promocional nunca se invertam
      const priceRaw = getVal(['price', 'preco', 'precoregular', 'regularprice', 'precovenda', 'valor', 'priceusd']);
      const promoRaw = getVal(['promotionalprice', 'promotional_price', 'precopromocional', 'promocional', 'promoprice', 'precooferta', 'oferta', 'desconto']);
      const costRaw = getVal(['costprice', 'cost_price', 'precocusto', 'custo', 'cost', 'custototal', 'precoaquisicao']);
      const stockRaw = getVal(['stockquantity', 'stock_quantity', 'stock', 'estoque', 'quantidade', 'qty', 'qtd', 'inventory']);
      const backorderRaw = getVal(['allowbackorder', 'allow_backorder', 'backorder', 'encomenda', 'prevenda', 'preorder', 'permiteencomenda']);
      const desc = String(getVal(['description', 'descricao', 'detalhes', 'details', 'bio'])).trim();
      const img = String(getVal(['imageurl', 'image_url', 'image', 'imagem', 'foto', 'photo', 'fotos', 'images'])).trim();

      // Se SKU e Título forem ambos vazios, é linha acidental de formatação no Excel
      if (!sku && !title) {
        emptyCount++;
        return;
      }

      const rowErrors: string[] = [];

      // Validação de SKU
      if (!sku) {
        rowErrors.push('SKU obrigatório ausente.');
      } else if (seenSkus.has(sku.toUpperCase())) {
        rowErrors.push(`SKU "${sku}" duplicado no arquivo (aparece mais de uma vez).`);
      } else {
        seenSkus.add(sku.toUpperCase());
      }

      // Validação de Título
      if (!title) {
        rowErrors.push('Nome/Título do produto obrigatório.');
      }

      // Validação de Categoria
      if (!category) {
        rowErrors.push('Categoria do produto obrigatória.');
      }

      // Validação de Cor e Tamanho
      if (!color) {
        rowErrors.push('Cor da variação obrigatória.');
      }
      if (!size) {
        rowErrors.push('Tamanho da variação obrigatório.');
      }

      // Validação e Parsing de Preço Regular (em dólares)
      const price = parseCurrencyValue(priceRaw);
      if (price <= 0) {
        rowErrors.push(`Preço regular deve ser maior que $0.00 (valor informado: "${priceRaw || 'vazio'}").`);
      }

      // Validação e Parsing de Preço de Custo (em dólares)
      const cost = costRaw !== '' ? parseCurrencyValue(costRaw) : 0;
      if (cost < 0 || isNaN(cost)) {
        rowErrors.push(`Preço de custo inválido (valor informado: "${costRaw}").`);
      }

      // Preço promocional (opcional)
      const promoPrice = promoRaw !== '' ? parseCurrencyValue(promoRaw) : null;

      // Estoque numérico
      const stock = parseInt(String(stockRaw).replace(/[^0-9]/g, '')) || 0;

      // Permissão de Encomenda (Backorder)
      const backorder =
        backorderRaw !== false &&
        String(backorderRaw).toLowerCase() !== 'false' &&
        String(backorderRaw) !== '0';

      if (rowErrors.length > 0) {
        rowErrors.forEach((msg) => {
          errors.push({
            row: lineNum,
            sku: sku || '---',
            field: msg.split(' ')[0],
            message: `Linha ${lineNum} [${sku || title || 'Item'}]: ${msg}`,
          });
        });
      } else {
        validRows.push({
          lineNum,
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
          hasImage: Boolean(img && img.trim().length > 0),
        });
      }
    });

    const uniqueTitles = new Set(validRows.map((r) => r.title));
    setUniqueProductsCount(uniqueTitles.size);
    setIgnoredEmptyCount(emptyCount);
    setValidatedRows(validRows);
    setValidationErrors(errors);
  };

  const handleConfirmImport = async () => {
    if (validatedRows.length === 0) return;
    setUploading(true);
    setImportSummary(null);

    try {
      const res = await fetch('/api/backoffice/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validatedRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
        }
        throw new Error(data.error || 'Falha ao processar importação no servidor.');
      }

      setImportSummary(data.summary);
      onSuccess(data.summary);
    } catch (err: any) {
      alert(err.message || 'Erro durante a importação.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidatedRows([]);
    setValidationErrors([]);
    setIgnoredEmptyCount(0);
    setUniqueProductsCount(0);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtragem de prévia por texto
  const filteredPreview = validatedRows.filter((r) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.sku.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.color.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-deep-black w-full max-w-5xl max-h-[92vh] flex flex-col shadow-luxury overflow-hidden">
        {/* Header do Modal */}
        <div className="p-5 bg-deep-black text-white border-b-2 border-gold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold text-deep-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                ERP BACKOFFICE • CATÁLOGO & ESTOQUE INTEGRADO
              </span>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                IMPORTAÇÃO EM MASSA POR PLANILHA (EXCEL .XLSX / .CSV)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Barra de Instrução & Download de Modelos */}
          <div className="p-4 bg-gold/10 border border-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>MODELOS OFICIAIS PRONTOS PARA USO</span>
              </h4>
              <p className="text-deep-black/80 text-[11px] leading-relaxed">
                Suporta planilhas <strong>Excel (.xlsx)</strong> e <strong>CSV</strong>. Linhas vazias são ignoradas automaticamente e preços em dólares são identificados com precisão.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="px-3.5 py-2 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1.5 shadow"
                title="Baixar modelo formatado para Microsoft Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-gold group-hover:text-deep-black" />
                <span>BAIXAR MODELO EXCEL (.XLSX)</span>
              </button>

              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="px-3 py-2 bg-white hover:bg-deep-black text-deep-black hover:text-white border border-deep-black text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1.5 shadow-sm"
                title="Baixar modelo padrão CSV UTF-8"
              >
                <Download className="w-3.5 h-3.5 text-gold" />
                <span>BAIXAR CSV</span>
              </button>
            </div>
          </div>

          {/* Banner de Aviso: Padrão Oculto / Rascunho */}
          <div className="p-3.5 bg-gold/10 border-2 border-gold/40 flex items-start gap-2.5">
            <span className="text-gold font-black text-sm leading-none shrink-0 mt-0.5">🛡️</span>
            <div className="text-[11px] text-deep-black leading-relaxed">
              <span className="font-black uppercase tracking-wider block text-deep-black">
                PADRÃO DE IMPORTAÇÃO: PRODUTOS ENTRAM COMO RASCUNHO OCULTO (NÃO APARECEM NO SITE)
              </span>
              <span>
                Para sua segurança e controle de qualidade, todas as peças importadas por planilha entram ocultas da vitrine. Você poderá entrar em cada produto, conferir fotos, cores e tamanhos, e ativá-lo com 1 clique para aparecer na vitrine.
              </span>
            </div>
          </div>

          {/* Área de Seleção de Arquivo */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-deep-black/30 hover:border-gold p-10 text-center cursor-pointer bg-gray-50/50 hover:bg-gold/5 transition space-y-3"
            >
              <Upload className="w-12 h-12 text-gold mx-auto" />
              <div className="space-y-1">
                <p className="font-black uppercase tracking-wider text-deep-black text-sm">
                  CLIQUE AQUI PARA SELECIONAR SUA PLANILHA EXCEL (.XLSX) OU .CSV
                </p>
                <p className="text-[11px] text-deep-black/60 uppercase">
                  Aceita arquivos .xlsx, .xls e .csv sem limite de produtos. Fotos podem ser adicionadas depois.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra do Arquivo e Resumo de Reconhecimento */}
              <div className="p-4 border-2 border-deep-black bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-gold shrink-0" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-deep-black text-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-deep-black/60 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Lendo arquivo com motor Excel nativo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 border border-deep-black/40 hover:bg-deep-black hover:text-white text-[10px] font-black uppercase tracking-wider transition"
                  >
                    SELECIONAR OUTRO ARQUIVO
                  </button>
                </div>
              </div>

              {/* KPIS DE VALIDAÇÃO E RECONHECIMENTO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-deep-black/5 border border-deep-black/20 text-center space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-deep-black/60 block">PRODUTOS IDENTIFICADOS</span>
                  <strong className="text-xl font-black text-deep-black font-mono">{uniqueProductsCount}</strong>
                  <span className="text-[8px] text-deep-black/50 uppercase block font-bold">Modelos distintos</span>
                </div>

                <div className="p-3 bg-deep-black/5 border border-deep-black/20 text-center space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-deep-black/60 block">VARIAÇÕES / SKUS</span>
                  <strong className="text-xl font-black text-green-700 font-mono">{validatedRows.length}</strong>
                  <span className="text-[8px] text-deep-black/50 uppercase block font-bold">Grades prontas</span>
                </div>

                <div className="p-3 bg-deep-black/5 border border-deep-black/20 text-center space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-deep-black/60 block">LINHAS VAZIAS IGNORADAS</span>
                  <strong className="text-xl font-black text-deep-black/70 font-mono">{ignoredEmptyCount}</strong>
                  <span className="text-[8px] text-deep-black/50 uppercase block font-bold">Células em branco</span>
                </div>

                <div className={`p-3 border text-center space-y-0.5 ${
                  validationErrors.length > 0
                    ? 'bg-red-50 border-red-500 text-red-950'
                    : 'bg-green-50 border-green-500 text-green-950'
                }`}>
                  <span className="text-[9px] font-black uppercase block">ERROS DE VALIDAÇÃO</span>
                  <strong className={`text-xl font-black font-mono ${
                    validationErrors.length > 0 ? 'text-red-600' : 'text-green-700'
                  }`}>
                    {validationErrors.length}
                  </strong>
                  <span className="text-[8px] uppercase block font-bold">
                    {validationErrors.length === 0 ? '✓ 100% Válido' : 'Pendências'}
                  </span>
                </div>
              </div>

              {/* Mensagem de Sucesso Pós-Importação */}
              {importSummary && (
                <div className="p-5 bg-green-50 border-2 border-green-600 text-green-950 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
                    <h4 className="font-black uppercase tracking-wider text-sm">
                      IMPORTAÇÃO CONCLUÍDA COM SUCESSO NO SUPABASE!
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-white border border-green-300">
                      <span className="text-[10px] font-bold uppercase text-green-800 block">Total Itens</span>
                      <strong className="text-lg font-black font-mono">{importSummary.totalRows}</strong>
                    </div>
                    <div className="p-3 bg-white border border-green-300">
                      <span className="text-[10px] font-bold uppercase text-green-800 block">Produtos Novos</span>
                      <strong className="text-lg font-black font-mono">{importSummary.productsCreated}</strong>
                    </div>
                    <div className="p-3 bg-white border border-green-300">
                      <span className="text-[10px] font-bold uppercase text-green-800 block">Variações Novas</span>
                      <strong className="text-lg font-black font-mono">{importSummary.variantsCreated}</strong>
                    </div>
                    <div className="p-3 bg-white border border-green-300">
                      <span className="text-[10px] font-bold uppercase text-green-800 block">Atualizados</span>
                      <strong className="text-lg font-black font-mono">
                        {importSummary.productsUpdated + importSummary.variantsUpdated}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista Detalhada de Erros de Validação por Linha */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-500 text-red-950 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <h4 className="font-black uppercase tracking-wider">
                        {validationErrors.length} ERRO(S) ENCONTRADO(S) NA PLANILHA:
                      </h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-red-700">
                      Indicação exata por linha
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-red-800 max-h-48 overflow-y-auto">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>
                        {err.message}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-red-700 uppercase font-bold pt-1 border-t border-red-200">
                    Nenhum produto foi descartado ou inventado. Corrija as linhas apontadas e reenvie a planilha.
                  </p>
                </div>
              )}

              {/* Tabela de Prévia dos Produtos Validados */}
              {validatedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deep-black/10 pb-2">
                    <h4 className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-gold" />
                      <span>PRÉ-VISUALIZAÇÃO DOS PRODUTOS RECONHECIDOS ({validatedRows.length} VARIAÇÕES SKU)</span>
                    </h4>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-deep-black/40 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="FILTRAR PRÉVIA..."
                        className="pl-8 pr-2.5 py-1 text-[10px] uppercase border border-deep-black/20 focus:border-deep-black w-48 font-mono"
                      />
                    </div>
                  </div>

                  <div className="border border-deep-black/20 overflow-x-auto max-h-72 overflow-y-auto shadow-sm">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-deep-black text-white uppercase text-[9px] font-black tracking-wider sticky top-0">
                        <tr>
                          <th className="p-2.5">Linha</th>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Produto</th>
                          <th className="p-2.5">Categoria</th>
                          <th className="p-2.5">Cor</th>
                          <th className="p-2.5">Tam</th>
                          <th className="p-2.5 text-right">Preço Regular</th>
                          <th className="p-2.5 text-right">Preço Promo</th>
                          <th className="p-2.5 text-right">Preço Custo</th>
                          <th className="p-2.5 text-center">Estoque</th>
                          <th className="p-2.5 text-center">Fotos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-deep-black/10">
                        {filteredPreview.map((r, idx) => (
                          <tr key={idx} className="hover:bg-gold/5 transition font-medium">
                            <td className="p-2 font-mono text-deep-black/50 text-[10px]">{r.lineNum}</td>
                            <td className="p-2 font-mono font-bold text-deep-black">{r.sku}</td>
                            <td className="p-2 font-bold uppercase text-deep-black">{r.title}</td>
                            <td className="p-2 uppercase text-deep-black/80">{r.category}</td>
                            <td className="p-2 uppercase text-deep-black/80">{r.color}</td>
                            <td className="p-2 font-mono font-bold text-deep-black">{r.size}</td>
                            <td className="p-2 font-mono font-bold text-deep-black text-right">
                              ${r.price.toFixed(2)}
                            </td>
                            <td className="p-2 font-mono text-right">
                              {r.promotional_price !== null ? (
                                <span className="font-bold text-gold">${r.promotional_price.toFixed(2)}</span>
                              ) : (
                                <span className="text-deep-black/30 font-normal">---</span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-deep-black/70 text-right">
                              ${r.cost_price.toFixed(2)}
                            </td>
                            <td className="p-2 font-mono text-center font-bold text-deep-black">
                              {r.stock_quantity} un
                            </td>
                            <td className="p-2 text-center">
                              {r.hasImage ? (
                                <span className="text-[8px] font-black uppercase text-green-700 bg-green-100 px-1.5 py-0.5 border border-green-300">
                                  ✓ COM FOTO
                                </span>
                              ) : (
                                <span
                                  className="text-[8px] font-bold uppercase text-gray-600 bg-gray-100 px-1.5 py-0.5 border border-gray-300"
                                  title="Produto sem fotos no arquivo. Fotos poderão ser incluídas depois pelo painel."
                                >
                                  SEM FOTO (OK)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé de Ações do Modal */}
        <div className="p-4 bg-gray-50 border-t-2 border-deep-black flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-wider transition"
          >
            {importSummary ? 'FECHAR' : 'CANCELAR'}
          </button>

          {selectedFile && !importSummary && (
            <button
              type="button"
              disabled={uploading || parsing || validationErrors.length > 0 || validatedRows.length === 0}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-deep-black hover:bg-gold text-white hover:text-deep-black disabled:opacity-50 text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-luxury"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                  <span>PROCESSANDO E GRAVANDO NO SUPABASE...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  <span>CONFIRMAR IMPORTAÇÃO DE {validatedRows.length} ITENS NO SUPABASE</span>
                </>
              )}
            </button>
          )}

          {importSummary && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-green-700 text-white hover:bg-green-800 text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-luxury"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>CONCLUÍDO • VOLTAR AO CATÁLOGO</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
