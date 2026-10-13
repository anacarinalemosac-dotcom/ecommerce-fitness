'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Monitor,
  Clock,
  MapPin,
  Compass,
  Search,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  ArrowUpRight,
  Activity,
  BarChart3,
  Globe,
  Users,
  CheckCircle2,
  Layers,
  ChevronRight,
  X,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface AccessPageVisit {
  path: string;
  title: string;
  visitedAt: number;
}

interface FormattedAccess {
  id: string;
  visitorId: string;
  date: string;
  timeFormatted: string;
  entryTime: number;
  lastPing: number;
  durationSeconds: number;
  durationFormatted: string;
  city: string;
  region: string;
  country: string;
  location: string;
  device: string;
  deviceType: 'mobile' | 'desktop';
  deviceTypeLabel: string;
  currentPath: string;
  currentTitle: string;
  pagesVisitedCount: number;
  pagesVisited: AccessPageVisit[];
  referrer: string;
  isOnlineNow: boolean;
}

interface ReportData {
  filterDate: string;
  availableDates: string[];
  today: string;
  metrics: {
    totalVisits: number;
    uniqueVisitors: number;
    avgDurationSeconds: number;
    avgDurationFormatted: string;
    mobileVisits: number;
    desktopVisits: number;
    mobilePercentage: number;
    desktopPercentage: number;
    topCity: string;
    topPage: string;
  };
  deviceBreakdown: Array<{ type: 'mobile' | 'desktop'; label: string; count: number; percentage: number }>;
  citiesBreakdown: Array<{ location: string; city: string; region: string; count: number; percentage: number }>;
  pagesBreakdown: Array<{ path: string; title: string; views: number; percentage: number }>;
  hourlyDistribution: Array<{ hour: string; label: string; count: number }>;
  accesses: FormattedAccess[];
}

export function AccessReportsView() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | '1m' | '3m' | '5m'>('all');
  const [selectedAccessForModal, setSelectedAccessForModal] = useState<FormattedAccess | null>(null);

  const fetchReports = async (date?: string) => {
    try {
      setLoading(true);
      const url = date ? `/api/backoffice/reports/accesses?date=${date}` : '/api/backoffice/reports/accesses';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setReport(data.report);
          if (!selectedDate) {
            setSelectedDate(data.report.filterDate);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar relatórios de acessos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedDate || undefined);
  }, [selectedDate]);

  const handleDownloadCsv = () => {
    const dateParam = selectedDate || report?.filterDate || '';
    const url = `/api/backoffice/reports/accesses?date=${encodeURIComponent(dateParam)}&format=csv`;
    window.open(url, '_blank');
  };

  // Filtragem dos acessos na tabela
  const filteredAccesses = useMemo(() => {
    if (!report?.accesses) return [];

    return report.accesses.filter((a) => {
      // Filtro de dispositivo
      if (deviceFilter !== 'all' && a.deviceType !== deviceFilter) {
        return false;
      }

      // Filtro de duração
      if (durationFilter === '1m' && a.durationSeconds < 60) return false;
      if (durationFilter === '3m' && a.durationSeconds < 180) return false;
      if (durationFilter === '5m' && a.durationSeconds < 300) return false;

      // Filtro de busca de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCity = (a.city || '').toLowerCase().includes(q);
        const matchesRegion = (a.region || '').toLowerCase().includes(q);
        const matchesDevice = (a.device || '').toLowerCase().includes(q);
        const matchesPath = (a.currentPath || '').toLowerCase().includes(q);
        const matchesTitle = (a.currentTitle || '').toLowerCase().includes(q);
        const matchesReferrer = (a.referrer || '').toLowerCase().includes(q);
        return matchesCity || matchesRegion || matchesDevice || matchesPath || matchesTitle || matchesReferrer;
      }

      return true;
    });
  }, [report?.accesses, deviceFilter, durationFilter, searchQuery]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Cabeçalho Principal com Seletores de Data e Ações */}
      <div className="bg-white border-2 border-deep-black p-6 sm:p-8 shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-ultra text-gold bg-deep-black px-2.5 py-0.5 border border-gold inline-flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-gold animate-pulse" />
              <span>TRAFFIC & RETENTION INTELLIGENCE</span>
            </span>
            <span className="text-xs text-deep-black/60 font-medium">
              Showroom Leominster, MA & USA
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-deep-black">
            RELATÓRIO DE ACESSOS AO SITE
          </h2>
          <p className="text-xs sm:text-sm text-deep-black/70 max-w-2xl mt-1 uppercase font-medium">
            Acompanhe todos os acessos do dia: cidades de origem, dispositivo (celular ou computador), páginas navegadas e tempo de permanência na loja.
          </p>
        </div>

        {/* Filtros de Data e Ações Rápidas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 self-stretch md:self-auto">
          {/* Pílulas de Data */}
          <div className="inline-flex rounded-none border border-deep-black p-0.5 bg-deep-black/5 text-xs font-black uppercase tracking-wider">
            <button
              onClick={() => setSelectedDate(report?.today || '')}
              className={`px-3 py-1.5 transition ${
                selectedDate === report?.today
                  ? 'bg-deep-black text-white shadow-xs'
                  : 'text-deep-black hover:text-gold'
              }`}
            >
              HOJE
            </button>
            <button
              onClick={() => setSelectedDate('all')}
              className={`px-3 py-1.5 transition ${
                selectedDate === 'all'
                  ? 'bg-deep-black text-white shadow-xs'
                  : 'text-deep-black hover:text-gold'
              }`}
            >
              TODOS
            </button>
          </div>

          {/* Input de Data Personalizada */}
          <div className="flex items-center gap-1 border border-deep-black px-3 py-1.5 bg-white">
            <Calendar className="w-3.5 h-3.5 text-deep-black/60" />
            <input
              type="date"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-deep-black outline-none bg-transparent"
            />
          </div>

          {/* Botão de Atualizar */}
          <button
            onClick={() => fetchReports(selectedDate || undefined)}
            disabled={loading}
            title="Atualizar Dados"
            className="p-2 border border-deep-black bg-white hover:bg-gold/10 text-deep-black transition flex items-center justify-center shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : 'text-deep-black'}`} />
          </button>

          {/* Botão de Baixar Planilha CSV */}
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 bg-deep-black text-gold border border-gold hover:bg-gold hover:text-deep-black transition text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xs shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORTAR CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Os 4 Cards de Métricas Principais (Gymshark Luxury Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Acessos */}
        <div className="bg-white border-2 border-deep-black p-5 shadow-luxury relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
              TOTAL DE ACESSOS DO DIA
            </span>
            <span className="p-1.5 bg-deep-black text-gold rounded-none">
              <Eye className="w-4 h-4 text-gold" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-black text-deep-black tracking-tight">
              {loading ? '...' : report?.metrics.totalVisits || 0}
            </div>
            <div className="text-[11px] font-bold text-deep-black/60 uppercase mt-0.5">
              {report?.metrics.uniqueVisitors || 0} visitantes únicos no período
            </div>
          </div>
          <div className="pt-2 border-t border-deep-black/10 flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-700">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Tráfego ao vivo e histórico salvo</span>
          </div>
        </div>

        {/* Card 2: Tempo Médio no Site */}
        <div className="bg-white border-2 border-deep-black p-5 shadow-luxury relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
              TEMPO MÉDIO NO SITE
            </span>
            <span className="p-1.5 bg-deep-black text-gold rounded-none">
              <Clock className="w-4 h-4 text-gold" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-black text-gold tracking-tight">
              {loading ? '...' : report?.metrics.avgDurationFormatted || '0s'}
            </div>
            <div className="text-[11px] font-bold text-deep-black/60 uppercase mt-0.5">
              por cliente na sessão da loja
            </div>
          </div>
          <div className="pt-2 border-t border-deep-black/10 flex items-center gap-1.5 text-[10px] font-black uppercase text-deep-black/70">
            <Sparkles className="w-3 h-3 text-gold" />
            <span>Alta retenção no catálogo</span>
          </div>
        </div>

        {/* Card 3: Dispositivo Mais Usado (Celular vs Computador) */}
        <div className="bg-white border-2 border-deep-black p-5 shadow-luxury relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
              DISPOSITIVOS (TEL / PC)
            </span>
            <span className="p-1.5 bg-deep-black text-gold rounded-none">
              <Smartphone className="w-4 h-4 text-gold" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-deep-black tracking-tight flex items-baseline gap-2">
              <span>📱 {report?.metrics.mobilePercentage || 0}%</span>
              <span className="text-sm font-bold text-deep-black/50">/ 💻 {report?.metrics.desktopPercentage || 0}%</span>
            </div>
            <div className="text-[11px] font-bold text-deep-black/60 uppercase mt-0.5">
              {report?.metrics.mobileVisits || 0} Celular vs {report?.metrics.desktopVisits || 0} Computador
            </div>
          </div>
          {/* Barra de Progresso visual */}
          <div className="w-full bg-deep-black/10 h-2 overflow-hidden flex">
            <div
              className="bg-gold h-full"
              style={{ width: `${report?.metrics.mobilePercentage || 0}%` }}
              title={`Celular: ${report?.metrics.mobilePercentage}%`}
            />
            <div
              className="bg-deep-black h-full"
              style={{ width: `${report?.metrics.desktopPercentage || 0}%` }}
              title={`Computador: ${report?.metrics.desktopPercentage}%`}
            />
          </div>
        </div>

        {/* Card 4: Top Cidade dos Acessos */}
        <div className="bg-white border-2 border-deep-black p-5 shadow-luxury relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
              TOP CIDADE DOS ACESSOS
            </span>
            <span className="p-1.5 bg-deep-black text-gold rounded-none">
              <MapPin className="w-4 h-4 text-gold" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-deep-black tracking-tight truncate">
              {loading ? '...' : report?.metrics.topCity || 'Massachusetts'}
            </div>
            <div className="text-[11px] font-bold text-deep-black/60 uppercase mt-0.5 truncate">
              Líder em volume de clientes hoje
            </div>
          </div>
          <div className="pt-2 border-t border-deep-black/10 flex items-center gap-1.5 text-[10px] font-black uppercase text-deep-black/70">
            <Globe className="w-3 h-3 text-gold" />
            <span>Massachusetts & Região</span>
          </div>
        </div>
      </div>

      {/* 3. Painéis de Análise Visual (Dispositivos, Cidades e Páginas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel 1: Detalhamento por Dispositivo (Telefone vs Computador) */}
        <div className="bg-white border-2 border-deep-black p-6 shadow-luxury space-y-4">
          <div className="flex items-center justify-between border-b-2 border-deep-black pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gold" />
              <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                DISPOSITIVO (TEL OU COMPUTADOR)
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-deep-black/50">Divisão</span>
          </div>

          <div className="space-y-4 pt-2">
            {/* Telefone / Celular */}
            <div className="p-4 border border-deep-black/15 bg-deep-black/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-deep-black text-gold">
                    <Smartphone className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-deep-black">TELEFONE / CELULAR</div>
                    <div className="text-[10px] text-deep-black/60 uppercase">iPhone, Samsung, Android</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-deep-black">
                    {report?.metrics.mobileVisits || 0}
                  </div>
                  <div className="text-[10px] font-black text-gold bg-deep-black px-1.5 py-0.2">
                    {report?.metrics.mobilePercentage || 0}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-deep-black/20 h-2">
                <div
                  className="bg-gold h-full"
                  style={{ width: `${report?.metrics.mobilePercentage || 0}%` }}
                />
              </div>
            </div>

            {/* Computador / Desktop */}
            <div className="p-4 border border-deep-black/15 bg-deep-black/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-deep-black text-gold">
                    <Monitor className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-deep-black">COMPUTADOR / PC</div>
                    <div className="text-[10px] text-deep-black/60 uppercase">Windows, MacBook, iMac</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-deep-black">
                    {report?.metrics.desktopVisits || 0}
                  </div>
                  <div className="text-[10px] font-black text-white bg-deep-black px-1.5 py-0.2">
                    {report?.metrics.desktopPercentage || 0}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-deep-black/20 h-2">
                <div
                  className="bg-deep-black h-full"
                  style={{ width: `${report?.metrics.desktopPercentage || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Painel 2: Cidades de Onde Vieram os Acessos */}
        <div className="bg-white border-2 border-deep-black p-6 shadow-luxury space-y-4">
          <div className="flex items-center justify-between border-b-2 border-deep-black pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                DE QUAL CIDADE VIERAM OS ACESSOS
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-deep-black/50">Top Locais</span>
          </div>

          <div className="space-y-2.5 pt-1 max-h-[260px] overflow-y-auto pr-1">
            {(!report?.citiesBreakdown || report.citiesBreakdown.length === 0) ? (
              <div className="text-xs text-deep-black/50 text-center py-8 uppercase">
                Nenhum dado geográfico registrado ainda.
              </div>
            ) : (
              report.citiesBreakdown.slice(0, 6).map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold uppercase">
                    <span className="flex items-center gap-1.5 text-deep-black truncate">
                      <span className="text-[10px] font-black text-gold bg-deep-black px-1 py-0.2">
                        #{idx + 1}
                      </span>
                      <span>{c.location}</span>
                    </span>
                    <span className="text-deep-black/70 shrink-0">
                      {c.count} visitas ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-deep-black/10 h-1.5">
                    <div
                      className="bg-deep-black h-full"
                      style={{ width: `${Math.min(100, c.percentage * 2.5)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Painel 3: Páginas Mais Acessadas do Site */}
        <div className="bg-white border-2 border-deep-black p-6 shadow-luxury space-y-4">
          <div className="flex items-center justify-between border-b-2 border-deep-black pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-gold" />
              <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                PÁGINAS MAIS ACESSADAS
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-deep-black/50">Visualizações</span>
          </div>

          <div className="space-y-2.5 pt-1 max-h-[260px] overflow-y-auto pr-1">
            {(!report?.pagesBreakdown || report.pagesBreakdown.length === 0) ? (
              <div className="text-xs text-deep-black/50 text-center py-8 uppercase">
                Nenhuma página registrada ainda.
              </div>
            ) : (
              report.pagesBreakdown.slice(0, 6).map((p, idx) => (
                <div key={idx} className="p-2 border border-deep-black/10 bg-deep-black/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black uppercase text-deep-black truncate max-w-[190px]" title={p.title}>
                      {p.title}
                    </span>
                    <span className="font-bold text-gold bg-deep-black px-1.5 py-0.2 text-[10px] shrink-0">
                      {p.views} views
                    </span>
                  </div>
                  <div className="text-[10px] text-deep-black/60 font-mono truncate">
                    {p.path}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabela Completa e Detalhada de Todos os Acessos */}
      <div className="bg-white border-2 border-deep-black shadow-luxury space-y-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-deep-black pb-4">
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-deep-black flex items-center gap-2">
              <span>TODOS OS ACESSOS DETALHADOS</span>
              <span className="bg-gold text-deep-black text-[10px] font-black px-2 py-0.5 rounded-none">
                {filteredAccesses.length} DE {report?.metrics.totalVisits || 0}
              </span>
            </h3>
            <p className="text-xs text-deep-black/60 uppercase mt-0.5 font-medium">
              Histórico cronológico de cada cliente: horário, cidade, dispositivo, página e tempo exato de permanência.
            </p>
          </div>

          {/* Filtros em Tempo Real da Tabela */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Campo de Busca */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-deep-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="BUSCAR CIDADE, PÁGINA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-bold uppercase pl-8 pr-3 py-1.5 border border-deep-black outline-none bg-white placeholder:text-deep-black/40"
              />
            </div>

            {/* Filtro Dispositivo */}
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value as any)}
              className="text-xs font-bold uppercase px-3 py-1.5 border border-deep-black bg-white outline-none cursor-pointer"
            >
              <option value="all">TODOS OS DISPOSITIVOS</option>
              <option value="mobile">📱 APENAS TELEFONE (CELULAR)</option>
              <option value="desktop">💻 APENAS COMPUTADOR (PC)</option>
            </select>

            {/* Filtro Tempo no Site */}
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value as any)}
              className="text-xs font-bold uppercase px-3 py-1.5 border border-deep-black bg-white outline-none cursor-pointer"
            >
              <option value="all">QUALQUER DURAÇÃO</option>
              <option value="1m">⏱️ MAIS DE 1 MINUTO</option>
              <option value="3m">⏱️ MAIS DE 3 MINUTOS</option>
              <option value="5m">⏱️ MAIS DE 5 MINUTOS</option>
            </select>
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-deep-black bg-deep-black text-white text-[10px] font-black uppercase tracking-wider">
                <th className="p-3">HORÁRIO</th>
                <th className="p-3">CIDADE DE ORIGEM</th>
                <th className="p-3">DISPOSITIVO (TEL / PC)</th>
                <th className="p-3">PÁGINA ACESSADA</th>
                <th className="p-3 text-center">TEMPO NO SITE</th>
                <th className="p-3">ORIGEM / REFERRER</th>
                <th className="p-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deep-black/10">
              {filteredAccesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-deep-black/50 uppercase font-bold">
                    Nenhum acesso encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAccesses.map((acc) => (
                  <tr
                    key={acc.id}
                    className="hover:bg-gold/5 transition group"
                  >
                    {/* Horário */}
                    <td className="p-3 font-mono font-bold text-deep-black">
                      <div className="flex items-center gap-1.5">
                        {acc.isOnlineNow && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Online Agora no Site" />
                        )}
                        <span>{acc.timeFormatted}</span>
                      </div>
                      <div className="text-[10px] text-deep-black/50 font-normal">
                        {acc.date}
                      </div>
                    </td>

                    {/* Cidade de Origem */}
                    <td className="p-3 font-bold text-deep-black">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="uppercase">{acc.city}, {acc.region}</span>
                      </div>
                      <div className="text-[10px] text-deep-black/50 font-normal uppercase pl-5">
                        {acc.country === 'US' ? 'Estados Unidos' : acc.country === 'BR' ? 'Brasil' : acc.country}
                      </div>
                    </td>

                    {/* Dispositivo (Telefone vs Computador) */}
                    <td className="p-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 font-black uppercase text-[10px] border border-deep-black shadow-xs">
                        {acc.deviceType === 'mobile' ? (
                          <>
                            <Smartphone className="w-3.5 h-3.5 text-gold" />
                            <span className="text-deep-black">TELEFONE (CELULAR)</span>
                          </>
                        ) : (
                          <>
                            <Monitor className="w-3.5 h-3.5 text-deep-black" />
                            <span className="text-deep-black">COMPUTADOR</span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-deep-black/60 truncate max-w-[150px] mt-0.5">
                        {acc.device}
                      </div>
                    </td>

                    {/* Página Acessada */}
                    <td className="p-3">
                      <div className="font-bold text-deep-black uppercase truncate max-w-[200px]" title={acc.currentTitle}>
                        {acc.currentTitle}
                      </div>
                      <div className="text-[10px] font-mono text-deep-black/60 truncate max-w-[200px]">
                        {acc.currentPath}
                      </div>
                      {acc.pagesVisitedCount > 1 && (
                        <div className="text-[9px] font-black text-gold bg-deep-black px-1.5 py-0.2 inline-block mt-0.5 uppercase">
                          {acc.pagesVisitedCount} páginas navegadas nesta visita
                        </div>
                      )}
                    </td>

                    {/* Tempo no Site */}
                    <td className="p-3 text-center">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase tracking-wider border ${
                        acc.durationSeconds >= 180
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : acc.durationSeconds >= 60
                          ? 'bg-gold/15 text-deep-black border-gold'
                          : 'bg-deep-black/5 text-deep-black/70 border-deep-black/20'
                      }`}>
                        <Clock className="w-3 h-3 text-gold" />
                        <span>{acc.durationFormatted}</span>
                      </div>
                    </td>

                    {/* Origem / Referrer */}
                    <td className="p-3 text-deep-black/70 text-[11px] uppercase">
                      {acc.referrer}
                    </td>

                    {/* Ações */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedAccessForModal(acc)}
                        className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-deep-black text-white hover:bg-gold hover:text-deep-black transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>VER ROTA</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal de Detalhes da Rota da Visita (Jornada do Visitante) */}
      {selectedAccessForModal && (
        <div className="fixed inset-0 z-50 bg-deep-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-deep-black shadow-luxury max-w-xl w-full p-6 space-y-6 animate-scaleUp">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between border-b-2 border-deep-black pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-ultra text-gold bg-deep-black px-2 py-0.5 border border-gold inline-block mb-1">
                  HISTÓRICO DA VISITA DO CLIENTE
                </span>
                <h3 className="text-lg font-black uppercase tracking-tight text-deep-black">
                  ROTA DE NAVEGAÇÃO NO SITE
                </h3>
              </div>
              <button
                onClick={() => setSelectedAccessForModal(null)}
                className="p-1.5 border border-deep-black hover:bg-deep-black hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo do Cliente */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-deep-black/5 p-4 border border-deep-black/15">
              <div>
                <span className="text-[10px] text-deep-black/60 uppercase block font-bold">CIDADE / LOCALIZAÇÃO</span>
                <span className="font-black text-deep-black uppercase flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-gold" />
                  {selectedAccessForModal.city}, {selectedAccessForModal.region}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-deep-black/60 uppercase block font-bold">DISPOSITIVO</span>
                <span className="font-black text-deep-black uppercase flex items-center gap-1 mt-0.5">
                  {selectedAccessForModal.deviceType === 'mobile' ? (
                    <Smartphone className="w-3 h-3 text-gold" />
                  ) : (
                    <Monitor className="w-3 h-3 text-deep-black" />
                  )}
                  {selectedAccessForModal.device}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-deep-black/60 uppercase block font-bold">TEMPO TOTAL NO SITE</span>
                <span className="font-black text-gold bg-deep-black px-1.5 py-0.2 inline-block mt-0.5">
                  ⏱️ {selectedAccessForModal.durationFormatted}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-deep-black/60 uppercase block font-bold">HORÁRIO DA ENTRADA</span>
                <span className="font-black text-deep-black uppercase mt-0.5 block">
                  {selectedAccessForModal.timeFormatted} ({selectedAccessForModal.date})
                </span>
              </div>
            </div>

            {/* Linha do Tempo / Rota das Páginas Navegadas */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gold" />
                <span>PÁGINAS NAVEGADAS PELO VISITANTE (PASSO A PASSO):</span>
              </h4>

              <div className="space-y-2 border-l-2 border-deep-black ml-3 pl-4 py-1">
                {selectedAccessForModal.pagesVisited.map((step, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    {/* Marcador na linha */}
                    <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-gold border-2 border-deep-black" />
                    
                    <div className="flex items-center justify-between text-xs font-bold text-deep-black">
                      <span className="uppercase">{step.title}</span>
                      <span className="text-[10px] text-deep-black/50 font-mono">
                        Passo {idx + 1}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-deep-black/60">
                      {step.path}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-4 border-t border-deep-black/10 flex justify-end">
              <button
                onClick={() => setSelectedAccessForModal(null)}
                className="px-6 py-2 bg-deep-black text-white hover:bg-gold hover:text-deep-black font-black uppercase text-xs tracking-widest transition"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
