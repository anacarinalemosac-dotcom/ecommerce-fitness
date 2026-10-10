'use client';

import React, { useState, useRef } from 'react';
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
} from 'lucide-react';

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
      'MACAQUINHOS',
      'Alta Compressao',
      '"squat-proof,zero-transparencia"',
      'Preto Onix',
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
      'SAM-BLK-M',
      'SAMANTA ROMPER',
      'MACAQUINHOS',
      'Alta Compressao',
      '"squat-proof,zero-transparencia"',
      'Preto Onix',
      'M',
      '44.90',
      '39.90',
      '16.00',
      '15',
      'true',
      '"Macaquinho modelador com bojo removivel e tecido duplo zero transparencia"',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    ],
    [
      'LEG-SCULPT-VIN-S',
      'LEGGING SCULPT LEVANTA BUMBUM',
      'LEGGINGS',
      'Seamless',
      '"compressao,cintura-alta"',
      'Vinho Marsala',
      'S',
      '49.90',
      '',
      '18.00',
      '8',
      'true',
      '"Legging com cos anatomico duplo e modelagem exclusiva que realca a silhueta"',
      '', // Deixado vazio de propósito para permitir adição manual de foto depois
    ],
    [
      'TOP-NAD-VIN-M',
      'TOP NADADOR ALTA SUSTENTACAO',
      'TOPS',
      'Alta Sustentacao',
      '"bojo-removivel,anti-suor"',
      'Vinho Marsala',
      'M',
      '34.90',
      '',
      '12.00',
      '12',
      'true',
      '"Top com costas nadador e elastico reforcado no torax para treinos pesados"',
      '', // Deixado vazio de propósito para permitir adição manual de foto depois
    ],
  ];

  const csvContent =
    '\uFEFF' + // UTF-8 BOM para garantir acentos perfeitos no Excel
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
  const [fileContent, setFileContent] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
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
    setImportSummary(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setFileContent(text);
      preValidateCsv(text);
      setParsing(false);
    };
    reader.onerror = () => {
      setValidationErrors([
        { row: 0, field: 'file', message: 'Erro ao ler o arquivo CSV.' },
      ]);
      setParsing(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const preValidateCsv = (text: string) => {
    const lines = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      setValidationErrors([
        {
          row: 0,
          field: 'file',
          message: 'O arquivo precisa conter cabeçalho e pelo menos 1 linha de dados.',
        },
      ]);
      setPreviewRows([]);
      return;
    }

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map((h) =>
      h.trim().toLowerCase().replace(/["\s_-]/g, '')
    );

    const rows: any[] = [];
    const errors: any[] = [];
    const seenSkus = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const lineNum = i + 1;
      const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

      const getVal = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          const idx = headers.indexOf(name.toLowerCase().replace(/["\s_-]/g, ''));
          if (idx !== -1 && cols[idx] !== undefined) {
            return cols[idx];
          }
        }
        return '';
      };

      const sku = getVal(['sku', 'codigo', 'cod']);
      const title = getVal(['title', 'titulo', 'nome', 'produto']);
      const category = getVal(['category', 'categoria']);
      const subcategory = getVal(['subcategory', 'subcategoria']);
      const tags = getVal(['tags', 'tag']);
      const color = getVal(['color', 'cor']);
      const size = getVal(['size', 'tamanho', 'tam']);
      const priceRaw = getVal(['price', 'preco', 'precoregular', 'regularprice']);
      const promoRaw = getVal(['promotionalprice', 'precopromocional', 'saleprice']);
      const costRaw = getVal(['costprice', 'precocusto', 'custo']);
      const stockRaw = getVal(['stockquantity', 'stock', 'estoque']);
      const backorderRaw = getVal(['allowbackorder', 'backorder', 'encomenda']);
      const desc = getVal(['description', 'descricao']);
      const img = getVal(['imageurl', 'image', 'imagem', 'foto']);

      // Validação de SKU
      if (!sku) {
        errors.push({ row: lineNum, field: 'sku', message: `Linha ${lineNum}: SKU obrigatório ausente.` });
      } else if (seenSkus.has(sku.toUpperCase())) {
        errors.push({ row: lineNum, sku, field: 'sku', message: `Linha ${lineNum}: SKU "${sku}" duplicado no arquivo.` });
      } else {
        seenSkus.add(sku.toUpperCase());
      }

      // Validação de Título
      if (!title) {
        errors.push({ row: lineNum, sku, field: 'title', message: `Linha ${lineNum}: Nome/Título do produto obrigatório.` });
      }

      // Validação de Categoria
      if (!category) {
        errors.push({ row: lineNum, sku, field: 'category', message: `Linha ${lineNum}: Categoria é obrigatória.` });
      }

      // Validação de Cor e Tamanho
      if (!color) {
        errors.push({ row: lineNum, sku, field: 'color', message: `Linha ${lineNum}: Cor é obrigatória.` });
      }
      if (!size) {
        errors.push({ row: lineNum, sku, field: 'size', message: `Linha ${lineNum}: Tamanho é obrigatório.` });
      }

      // Validação de Preço Regular
      const price = parseFloat(priceRaw.replace(',', '.'));
      if (isNaN(price) || price <= 0) {
        errors.push({ row: lineNum, sku, field: 'price', message: `Linha ${lineNum}: Preço regular de venda deve ser maior que zero.` });
      }

      // Validação de Preço de Custo
      const cost = parseFloat(costRaw.replace(',', '.'));
      if (isNaN(cost) || cost < 0) {
        errors.push({ row: lineNum, sku, field: 'cost_price', message: `Linha ${lineNum}: Preço de custo deve ser numérico >= 0.` });
      }

      rows.push({
        lineNum,
        sku: sku ? sku.toUpperCase() : '---',
        title: title || '---',
        category: category || '---',
        subcategory: subcategory || 'Geral',
        color: color || '---',
        size: size || '---',
        price: isNaN(price) ? 0 : price,
        promo: promoRaw || null,
        cost: isNaN(cost) ? 0 : cost,
        stock: parseInt(stockRaw) || 0,
        backorder: backorderRaw !== 'false' && backorderRaw !== '0',
        hasImage: Boolean(img && img.trim().length > 0),
        imgUrl: img || '',
        desc,
      });
    }

    setPreviewRows(rows);
    setValidationErrors(errors);
  };

  const handleConfirmImport = async () => {
    if (!fileContent) return;
    setUploading(true);
    setImportSummary(null);

    try {
      const res = await fetch('/api/backoffice/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: fileContent }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
        }
        throw new Error(data.error || 'Falha ao processar importação.');
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
    setFileContent('');
    setPreviewRows([]);
    setValidationErrors([]);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-deep-black w-full max-w-4xl max-h-[90vh] flex flex-col shadow-luxury overflow-hidden">
        {/* Header do Modal */}
        <div className="p-5 bg-deep-black text-white border-b-2 border-gold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold text-deep-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                ERP BACKOFFICE • SUPABASE INTEGRADO
              </span>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                IMPORTAÇÃO EM MASSA DE PRODUTOS VIA CSV
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
          {/* Barra de Instrução & Download do Modelo */}
          <div className="p-4 bg-gold/10 border border-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>FORMATO OFICIAL RECOMENDADO</span>
              </h4>
              <p className="text-deep-black/80 text-[11px] leading-relaxed">
                Baixe o modelo com cabeçalhos pré-configurados (<strong>sku, title, category, tags, color, size, price, cost_price, stock_quantity, allow_backorder, description, image_url</strong>).
              </p>
            </div>

            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="px-4 py-2.5 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-[11px] font-black uppercase tracking-widest transition flex items-center gap-2 shrink-0 shadow"
            >
              <Download className="w-4 h-4 text-gold group-hover:text-deep-black" />
              <span>BAIXAR MODELO CSV</span>
            </button>
          </div>

          {/* Área de Seleção de Arquivo */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-deep-black/30 hover:border-gold p-8 text-center cursor-pointer bg-gray-50/50 hover:bg-gold/5 transition space-y-3"
            >
              <Upload className="w-10 h-10 text-gold mx-auto" />
              <div className="space-y-1">
                <p className="font-black uppercase tracking-wider text-deep-black text-sm">
                  CLIQUE PARA SELECIONAR A PLANILHA CSV
                </p>
                <p className="text-[11px] text-deep-black/60 uppercase">
                  Suporta arquivos .CSV com codificação UTF-8 (separados por vírgula ou ponto-e-vírgula)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Arquivo Carregado */}
              <div className="p-4 border-2 border-deep-black bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-gold" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-deep-black">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-deep-black/60 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {previewRows.length} linhas detectadas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 border border-deep-black/40 hover:bg-deep-black hover:text-white text-[10px] font-black uppercase tracking-wider transition"
                  >
                    TROCAR ARQUIVO
                  </button>
                </div>
              </div>

              {/* Resultado de Sucesso */}
              {importSummary && (
                <div className="p-5 bg-green-50 border-2 border-green-600 text-green-950 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-700" />
                    <h4 className="font-black uppercase tracking-wider text-sm">
                      IMPORTAÇÃO CONCLUÍDA COM SUCESSO NO SUPABASE!
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-white border border-green-300">
                      <span className="text-[10px] font-bold uppercase text-green-800 block">Total Linhas</span>
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

              {/* Erros de Validação */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-500 text-red-950 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <h4 className="font-black uppercase tracking-wider">
                      {validationErrors.length} ERRO(S) DE VALIDAÇÃO ENCONTRADO(S):
                    </h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-red-800 max-h-40 overflow-y-auto">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>
                        <strong>{err.field.toUpperCase()}:</strong> {err.message}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-red-700 uppercase font-bold pt-1">
                    Corrija os dados apontados acima e carregue o arquivo novamente.
                  </p>
                </div>
              )}

              {/* Tabela de Pré-Visualização das Linhas */}
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-gold" />
                      <span>PRÉ-VISUALIZAÇÃO DOS DADOS ({previewRows.length} VARIAÇÕES SKU)</span>
                    </h4>
                    <span className="text-[10px] text-deep-black/60 font-bold uppercase">
                      Imagens vazias permitirão upload manual posterior no catálogo
                    </span>
                  </div>

                  <div className="border border-deep-black/20 overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-deep-black text-white uppercase text-[9px] font-black tracking-wider sticky top-0">
                        <tr>
                          <th className="p-2.5">Linha</th>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Produto</th>
                          <th className="p-2.5">Categoria</th>
                          <th className="p-2.5">Cor</th>
                          <th className="p-2.5">Tamanho</th>
                          <th className="p-2.5">Preço Venda</th>
                          <th className="p-2.5">Preço Custo</th>
                          <th className="p-2.5">Estoque</th>
                          <th className="p-2.5">Foto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-deep-black/10">
                        {previewRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-gold/5 transition font-medium">
                            <td className="p-2 font-mono text-deep-black/60">{r.lineNum}</td>
                            <td className="p-2 font-mono font-bold text-deep-black">{r.sku}</td>
                            <td className="p-2 font-bold uppercase text-deep-black">{r.title}</td>
                            <td className="p-2 uppercase text-deep-black/80">{r.category}</td>
                            <td className="p-2 uppercase text-deep-black/80">{r.color}</td>
                            <td className="p-2 font-mono font-bold text-deep-black">{r.size}</td>
                            <td className="p-2 font-mono font-bold text-gold">${r.price.toFixed(2)}</td>
                            <td className="p-2 font-mono text-deep-black/70">${r.cost.toFixed(2)}</td>
                            <td className="p-2 font-mono text-deep-black">{r.stock}</td>
                            <td className="p-2">
                              {r.hasImage ? (
                                <span className="text-[9px] font-black uppercase text-green-700 bg-green-100 px-1.5 py-0.5">
                                  ✓ URL
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold uppercase text-gray-500 bg-gray-100 px-1.5 py-0.5" title="Poderá ser inserida manualmente">
                                  VAZIA (MANUAL)
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
              disabled={uploading || validationErrors.length > 0}
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
                  <span>CONFIRMAR IMPORTAÇÃO ({previewRows.length} LINHAS)</span>
                </>
              )}
            </button>
          )}

          {importSummary && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-green-700 text-white hover:bg-green-800 text-xs font-black uppercase tracking-widest transition flex items-center gap-2"
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
