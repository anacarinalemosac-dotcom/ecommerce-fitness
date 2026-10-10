'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStoreSettings, ProductItem } from '../../context/StoreSettingsContext';
import { ImageUploadBox } from '../../components/ImageUploadBox';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Package,
  Image as ImageIcon,
  Settings,
  PlusCircle,
  Trash2,
  Edit3,
  Check,
  Eye,
  ArrowRight,
  ExternalLink,
  LogOut,
  Truck,
  Phone,
  Instagram,
  MapPin,
  RefreshCw,
  Video,
  Layers,
  Star,
  CheckCircle2,
} from 'lucide-react';

export default function AdminPortalPage() {
  const {
    adminUser,
    siteInfo,
    siteImages,
    products,
    loginAdmin,
    logoutAdmin,
    updateSiteInfo,
    updateSiteImages,
    addProduct,
    updateProduct,
    deleteProduct,
    resetToDefaults,
  } = useStoreSettings();

  const [activeTab, setActiveTab] = useState<'products' | 'images' | 'info'>('products');
  const [loginEmail, setLoginEmail] = useState('anafitweareua@gmail.com');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Estado local para edição de Informações
  const [tempInfo, setTempInfo] = useState(siteInfo);

  // Estado local para edição de Imagens
  const [tempImages, setTempImages] = useState(siteImages);

  const triggerSuccess = (msg: string) => {
    setSavedSuccessMessage(msg);
    setTimeout(() => setSavedSuccessMessage(null), 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAdmin(loginEmail, loginPass);
    if (ok) {
      setLoginError('');
      triggerSuccess('Bem-vinda, Ana Carina! Acesso de Administradora autenticado com sucesso.');
    } else {
      setLoginError('Senha incorreta! Digite a senha master da loja.');
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfo(tempInfo);
    triggerSuccess('Informações da loja atualizadas com sucesso em todo o site!');
  };

  const handleSaveImages = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteImages(tempImages);
    triggerSuccess('Imagens e banners do site atualizados com sucesso!');
  };



  // =========================================================================
  // TELA DE LOGIN DO ADMINISTRADOR (QUANDO NÃO LOGADO)
  // =========================================================================
  if (!adminUser.isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-white selection:bg-deep-black selection:text-gold">
        <div className="max-w-md w-full bg-white border-2 border-deep-black p-8 sm:p-10 shadow-luxury space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-deep-black text-gold border border-gold/40 shadow-sm">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-deep-black">
              PORTAL DO ADMINISTRADOR
            </h1>
            <p className="text-xs text-deep-black/60 uppercase font-medium">
              ANA FITNESS WEAR • GESTÃO MASTER
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border-2 border-red-600 text-red-700 text-xs font-bold uppercase text-center animate-shake">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                E-mail de Administradora
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-3 border-2 border-deep-black font-bold text-xs focus:outline-none focus:border-gold"
                placeholder="anafitweareua@gmail.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Senha de Acesso Master
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full p-3 border-2 border-deep-black font-bold text-xs focus:outline-none focus:border-gold"
                placeholder="Digite sua senha..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-gold group-hover:text-deep-black" />
              <span>ACESSAR PAINEL ADMINISTRADOR</span>
            </button>
          </form>

          <div className="pt-4 border-t border-deep-black/10 text-center">
            <p className="text-[10px] text-deep-black/50 uppercase font-bold">
              🔒 Acesso restrito e criptografado para a proprietária da loja.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DASHBOARD PRINCIPAL DO ADMINISTRADOR
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 bg-white selection:bg-deep-black selection:text-gold">
      {/* Top Banner de Administradora Conectada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-deep-black text-white p-6 sm:p-8 border-2 border-gold/40 shadow-luxury">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[10px] font-black uppercase tracking-widest text-gold border border-gold/30">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span>PERFIL ADMINISTRADOR MASTER • ANA CARINA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider flex items-center gap-3">
            <img src="/symbol-ana-fitness.png" alt="Ana Fitness" className="w-8 h-8 object-contain" />
            <span>CENTRAL DE CONTROLE DO SITE</span>
          </h1>
          <p className="text-xs text-white/60 uppercase tracking-wider">
            Insira produtos, edite as imagens e altere todas as informações e textos do site com atualização instantânea.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/backoffice?tab=sales"
            className="px-4 py-2.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-sm border border-gold"
          >
            <Package className="w-3.5 h-3.5 text-deep-black" />
            <span>📦 VER PEDIDOS DOS CLIENTES</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 bg-white hover:bg-gold text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-sm"
          >
            <span>VER LOJA AO VIVO</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={logoutAdmin}
            className="p-2.5 bg-white/10 hover:bg-white hover:text-deep-black text-white border border-white/20 transition"
            title="Sair do Perfil Administrador"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner de Destaque: Acesso aos Pedidos dos Clientes */}
      <div className="p-5 bg-gold text-deep-black border-2 border-deep-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-luxury">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-deep-black animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black">CENTRAL DE EXPEDIÇÃO & VENDAS</span>
          </div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black">
            📦 ACOMPANHAR PEDIDOS DE CLIENTES & LUCRO REAL
          </h2>
          <p className="text-xs uppercase font-bold text-deep-black/80">
            Veja nome, itens, endereço de entrega USPS, forma de pagamento e margem de lucro de cada compra simulada ou real.
          </p>
        </div>
        <Link
          href="/backoffice?tab=sales"
          className="px-6 py-3.5 bg-deep-black hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shrink-0 shadow-md border-2 border-deep-black"
        >
          <span>ACESSAR PEDIDOS NO BACKOFFICE →</span>
        </Link>
      </div>

      {/* Mensagem de Feedback de Sucesso */}
      {savedSuccessMessage && (
        <div className="p-4 bg-deep-black text-white border-2 border-gold flex items-center justify-between text-xs font-black uppercase tracking-wider animate-fadeIn">
          <div className="flex items-center gap-2 text-gold">
            <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
            <span>{savedSuccessMessage}</span>
          </div>
          <Link href="/" className="text-white hover:text-gold underline flex items-center gap-1">
            <span>Ver no Site</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Navegação entre as 3 Abas Principais Solicitadas */}
      <div className="flex border-b-2 border-deep-black/10 gap-3 sm:gap-6 text-xs font-black uppercase tracking-widest overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'products'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Package className="w-4 h-4 text-gold" /> 1. INSERIR & GERENCIAR PRODUTOS ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'images'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-gold" /> 2. EDITAR IMAGENS DO SITE
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'info'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Settings className="w-4 h-4 text-gold" /> 3. EDITAR INFORMAÇÕES DO SITE
        </button>
      </div>

      {/* Banner de Referência de Painel Administrativo Sob Medida */}
      <div className="bg-gold/10 border-2 border-gold p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-luxury">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 bg-deep-black text-gold border border-gold shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                PODEMOS SEGUIR O PARÂMETRO EXATO DO ADMINISTRATIVO QUE VOCÊ ENVIAR
              </h4>
              <span className="text-[9px] bg-deep-black text-gold border border-gold px-2 py-0.5 font-black uppercase">
                100% ADAPTÁVEL
              </span>
            </div>
            <p className="text-[11px] text-deep-black/80 font-medium leading-relaxed">
              Ana Carina, se você tiver um site ou sistema de referência (por exemplo da Shopify, Wix, Nuvemshop ou qualquer outro), basta enviar o link ou prints das telas que adaptamos todos os campos, menus e etapas exatamente como você preferir!
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ABA 1: GESTÃO OFICIAL CENTRALIZADA DE PRODUTOS NO ERP BACKOFFICE
         ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-8">
          {/* BANNER CENTRALIZADOR DA GESTÃO DE PRODUTOS */}
          <div className="bg-deep-black text-white p-6 sm:p-8 border-2 border-gold shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold text-deep-black text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CENTRALIZAÇÃO OFICIAL DE PRODUTOS & ESTOQUE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                CADASTRO E GRADE DE VARIAÇÕES UNIFICADOS NO ERP BACKOFFICE
              </h2>
              <p className="text-xs text-white/70 uppercase tracking-wide leading-relaxed">
                Para evitar retrabalho e duplicidade de informações, o cadastro completo de peças (com fotos, vídeos, fornecedor, preço em dólar, custo, grade de cor e tamanho, estoque e encomendas) foi centralizado no ERP Backoffice da Ana Fitness Wear.
              </p>
            </div>

            <Link
              href="/backoffice"
              className="px-8 py-4 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-3 shrink-0 shadow-luxury"
            >
              <span>⚡ ABRIR GESTÃO DE PRODUTOS NO ERP BACKOFFICE</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Tabela de Produtos Cadastrados com Edição e Exclusão */}
          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-4">IMAGEM</th>
                  <th className="p-4">NOME / CATEGORIA</th>
                  <th className="p-4">PREÇO ($)</th>
                  <th className="p-4">CUSTO ($)</th>
                  <th className="p-4">ESTOQUE</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-deep-black/5">
                    <td className="p-4">
                      <div className="relative w-12 aspect-[4/5] bg-deep-black/10 overflow-hidden border border-deep-black/20">
                        <img src={item.primaryImage} alt={item.title} className="w-full h-full object-cover" />
                        {item.galleryImages && item.galleryImages.length > 0 && (
                          <span className="absolute bottom-0 right-0 bg-deep-black text-gold text-[7px] font-black px-1 border-t border-l border-gold/40">
                            +{1 + item.galleryImages.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-black text-deep-black block">{item.title}</span>
                      <span className="text-[10px] text-gold font-bold">{item.categoryPt}</span>
                    </td>
                    <td className="p-4 font-mono font-black text-deep-black">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="p-4 font-mono text-deep-black/70">
                      ${item.costPrice.toFixed(2)}
                    </td>
                    <td className="p-4 font-mono">
                      <span className="font-black text-deep-black">{item.stock} UNID. TOTAL</span>
                      {item.sizeStock && (
                        <div className="flex flex-wrap gap-1 mt-1 font-mono">
                          {Object.entries(item.sizeStock).map(([sz, q]) => (
                            <span
                              key={sz}
                              className={`text-[8px] font-black px-1.5 py-0.5 border ${
                                Number(q) > 0
                                  ? 'bg-deep-black/5 text-deep-black border-deep-black/20'
                                  : 'bg-white text-deep-black/30 border-deep-black/10'
                              }`}
                              title={`${sz}: ${q} unidades`}
                            >
                              {sz}:{q}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {item.stock > 0 ? (
                        <span className="px-2 py-0.5 bg-deep-black text-white text-[9px] font-black">
                          PRONTA ENTREGA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-deep-black text-gold border border-gold text-[9px] font-black">
                          PRÉ-VENDA
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href="/backoffice"
                          className="px-2.5 py-1.5 border border-deep-black hover:bg-gold hover:text-deep-black transition inline-flex items-center gap-1.5 font-bold text-[10px]"
                          title="Editar e gerenciar grade no ERP Backoffice"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>EDITAR NO ERP</span>
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente remover o produto ${item.title}?`)) {
                              deleteProduct(item.id);
                              triggerSuccess(`Produto ${item.title} removido com sucesso.`);
                            }
                          }}
                          className="p-2 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition"
                          title="Excluir Peça"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 2: EDITAR IMAGENS DO SITE (BANNERS, VÍDEO, CATEGORIAS & MURAL)
         ========================================================================= */}
      {activeTab === 'images' && (
        <form onSubmit={handleSaveImages} className="space-y-8">
          <div className="bg-white border-2 border-deep-black p-6 space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                GERENCIADOR DE MÍDIAS & BANNERS
              </span>
              <h2 className="text-xl font-black uppercase tracking-wider text-deep-black mt-1">
                EDITAR IMAGENS E VÍDEOS DE DESTAQUE
              </h2>
              <p className="text-xs text-deep-black/60 uppercase">
                Cole novos links/URLs de imagens em alta definição. As alterações refletem imediatamente no site.
              </p>
            </div>

            {/* 1. HERO BANNER PRINCIPAL (FUNDO) */}
            <div className="p-5 border-2 border-deep-black space-y-4">
              <h3 className="text-sm font-black uppercase text-deep-black flex items-center gap-2">
                <Video className="w-4 h-4 text-gold" /> 1. HERO BANNER PRINCIPAL (VÍDEO / PÔSTER DO TOPO)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">
                    Link do Vídeo MP4 de Fundo
                  </label>
                  <input
                    type="url"
                    value={tempImages.heroVideo}
                    onChange={(e) => setTempImages({ ...tempImages, heroVideo: e.target.value })}
                    className="w-full p-3 border border-deep-black font-mono text-xs focus:outline-none focus:border-gold"
                  />
                </div>
                <div className="space-y-1">
                  <ImageUploadBox
                    label="Foto Pôster / Imagem HD de Fundo do Hero"
                    helperText="Selecione a foto principal do topo da loja salva no seu computador ou celular."
                    value={tempImages.heroPoster}
                    onChange={(url) => setTempImages({ ...tempImages, heroPoster: url })}
                    aspectRatio="aspect-video"
                  />
                </div>
              </div>
            </div>

            {/* 2. BLOCO DE ENGENHARIA TÊXTIL (SQUAT-PROOF) */}
            <div className="p-5 border-2 border-deep-black space-y-4">
              <h3 className="text-sm font-black uppercase text-deep-black flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" /> 2. FOTO DA SEÇÃO DE ENGENHARIA TÊXTIL (SQUAT-PROOF)
              </h3>
              <div className="space-y-1">
                <ImageUploadBox
                  label="Foto da Seção Tecnológica"
                  helperText="Selecione a foto da modelo em agachamento ou treino para o bloco de especificações têxteis."
                  value={tempImages.techSectionImage}
                  onChange={(url) => setTempImages({ ...tempImages, techSectionImage: url })}
                  aspectRatio="aspect-[4/5]"
                />
              </div>
            </div>

            {/* 3. IMAGENS DAS 5 CATEGORIAS */}
            <div className="p-5 border-2 border-deep-black space-y-4">
              <h3 className="text-sm font-black uppercase text-deep-black flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold" /> 3. FOTOS DOS CARDS DE CATEGORIAS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">CONJUNTOS (SETS)</label>
                  <input
                    type="url"
                    value={tempImages.categoryImages.sets}
                    onChange={(e) =>
                      setTempImages({
                        ...tempImages,
                        categoryImages: { ...tempImages.categoryImages, sets: e.target.value },
                      })
                    }
                    className="w-full p-2.5 border border-deep-black font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">MACAQUINHOS (ROMPERS)</label>
                  <input
                    type="url"
                    value={tempImages.categoryImages.rompers}
                    onChange={(e) =>
                      setTempImages({
                        ...tempImages,
                        categoryImages: { ...tempImages.categoryImages, rompers: e.target.value },
                      })
                    }
                    className="w-full p-2.5 border border-deep-black font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">MACACÕES (JUMPSUITS)</label>
                  <input
                    type="url"
                    value={tempImages.categoryImages.jumpsuits}
                    onChange={(e) =>
                      setTempImages({
                        ...tempImages,
                        categoryImages: { ...tempImages.categoryImages, jumpsuits: e.target.value },
                      })
                    }
                    className="w-full p-2.5 border border-deep-black font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">TOPS</label>
                  <input
                    type="url"
                    value={tempImages.categoryImages.tops}
                    onChange={(e) =>
                      setTempImages({
                        ...tempImages,
                        categoryImages: { ...tempImages.categoryImages, tops: e.target.value },
                      })
                    }
                    className="w-full p-2.5 border border-deep-black font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">PRÉ-VENDA SOB MEDIDA</label>
                  <input
                    type="url"
                    value={tempImages.categoryImages.preorder}
                    onChange={(e) =>
                      setTempImages({
                        ...tempImages,
                        categoryImages: { ...tempImages.categoryImages, preorder: e.target.value },
                      })
                    }
                    className="w-full p-2.5 border border-deep-black font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Salvar Imagens */}
            <div className="pt-2">
              <button
                type="submit"
                className="px-8 py-4 bg-gold hover:bg-deep-black hover:text-gold text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SALVAR TODAS AS IMAGENS DO SITE</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =========================================================================
          ABA 3: EDITAR INFORMAÇÕES DO SITE (TEXTOS, CONTATOS, FRETES & POLÍTICAS)
         ========================================================================= */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveInfo} className="space-y-8">
          <div className="bg-white border-2 border-deep-black p-6 space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                INFORMAÇÕES INSTITUCIONAIS & TEXTOS
              </span>
              <h2 className="text-xl font-black uppercase tracking-wider text-deep-black mt-1">
                EDITAR DADOS DA LOJA, CONTATO E POLÍTICAS
              </h2>
              <p className="text-xs text-deep-black/60 uppercase">
                Altere o WhatsApp, Instagram, endereço em Massachusetts, taxa de frete e frases da loja.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contatos & Redes */}
              <div className="p-5 border-2 border-deep-black space-y-4">
                <h3 className="text-xs font-black uppercase text-gold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gold" /> CANAIS DE ATENDIMENTO & LOCALIZAÇÃO
                </h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">
                    Telefone e WhatsApp Oficial
                  </label>
                  <input
                    type="text"
                    value={tempInfo.phone}
                    onChange={(e) => setTempInfo({ ...tempInfo, phone: e.target.value })}
                    className="w-full p-3 border border-deep-black font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">
                    Instagram Oficial (@handle)
                  </label>
                  <input
                    type="text"
                    value={tempInfo.instagram}
                    onChange={(e) =>
                      setTempInfo({
                        ...tempInfo,
                        instagram: e.target.value,
                        instagramUrl: `https://www.instagram.com/${e.target.value.replace('@', '')}`,
                      })
                    }
                    className="w-full p-3 border border-deep-black font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">
                    Endereço da Sede (EUA)
                  </label>
                  <input
                    type="text"
                    value={tempInfo.address}
                    onChange={(e) => setTempInfo({ ...tempInfo, address: e.target.value })}
                    className="w-full p-3 border border-deep-black font-bold text-xs"
                  />
                </div>
              </div>

              {/* Frete & Garantias */}
              <div className="p-5 border-2 border-deep-black space-y-4">
                <h3 className="text-xs font-black uppercase text-gold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gold" /> VALORES DE FRETE & PRAZOS
                </h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">
                    Taxa Fixa de Frete para os EUA ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-black text-deep-black">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempInfo.flatShippingRate}
                      onChange={(e) =>
                        setTempInfo({ ...tempInfo, flatShippingRate: parseFloat(e.target.value) || 9.99 })
                      }
                      className="w-full p-3 pl-7 border border-deep-black font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">
                    Prazo de Trocas & Devoluções (Dias)
                  </label>
                  <input
                    type="number"
                    value={tempInfo.returnDays}
                    onChange={(e) => setTempInfo({ ...tempInfo, returnDays: parseInt(e.target.value) || 30 })}
                    className="w-full p-3 border border-deep-black font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">
                    Slogan do Ticker Superior
                  </label>
                  <input
                    type="text"
                    value={tempInfo.tickerSlogan}
                    onChange={(e) => setTempInfo({ ...tempInfo, tickerSlogan: e.target.value })}
                    className="w-full p-3 border border-deep-black font-bold text-xs"
                  />
                </div>
              </div>

              {/* Textos do Hero */}
              <div className="p-5 border-2 border-deep-black space-y-4 md:col-span-2">
                <h3 className="text-xs font-black uppercase text-gold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" /> TEXTOS DE DESTAQUE DO HERO BANNER
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-deep-black">Título Linha 1</label>
                    <input
                      type="text"
                      value={tempInfo.heroTitle1}
                      onChange={(e) => setTempInfo({ ...tempInfo, heroTitle1: e.target.value })}
                      className="w-full p-3 border border-deep-black font-black text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-deep-black">Título Linha 2</label>
                    <input
                      type="text"
                      value={tempInfo.heroTitle2}
                      onChange={(e) => setTempInfo({ ...tempInfo, heroTitle2: e.target.value })}
                      className="w-full p-3 border border-deep-black font-black text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-deep-black">Subtítulo Explicativo</label>
                  <textarea
                    rows={2}
                    value={tempInfo.heroSubtitle}
                    onChange={(e) => setTempInfo({ ...tempInfo, heroSubtitle: e.target.value })}
                    className="w-full p-3 border border-deep-black font-medium text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Salvar Informações */}
            <div className="pt-2 flex gap-4">
              <button
                type="submit"
                className="px-8 py-4 bg-gold hover:bg-deep-black hover:text-gold text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SALVAR TODAS AS INFORMAÇÕES DO SITE</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja restaurar as configurações padrão da loja?')) {
                    resetToDefaults();
                    triggerSuccess('Configurações padrão restauradas.');
                  }
                }}
                className="px-6 py-4 bg-white border border-deep-black text-deep-black hover:bg-deep-black/5 font-black text-xs uppercase tracking-widest transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>RESTAURAR PADRÕES</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
