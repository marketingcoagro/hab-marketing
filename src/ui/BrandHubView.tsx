// src/ui/BrandHubView.tsx
// Módulo 4 & Seção 7 da Especificação: Kit Corporativo de Colaboradores, Papelaria A4, Vetores SVG & Diretório de Lojas

import React, { useState, useRef } from 'react';
import { useStudioStore, studioActions } from '../core/store';
import {
  COAGRO_STORES,
  COAGRO_CORPORATE_INFO,
  getCoagroStoreById,
  type CoagroStore,
} from '../core/coagroStores';
import {
  LogoHorizontalAzul,
  LogoHorizontalBranca,
  CoagroSimboloCasinha,
} from './coagroLogos';
import {
  CoagroBadgeTemplate,
  CoagroBusinessCardTemplate,
  CoagroEmailSignatureTemplate,
  CoagroProfileTemplate,
} from './CoagroIdentityTemplates';
import { exportElementToPng, printOrSaveA4Sheet } from '../engine/exporter';
import { DEFAULT_ERP_CATALOG_DB, formatBRL } from '../core/businessRules';
import type { ErpCatalogRecord, RegulatoryCategory } from '../core/types';

export type BrandHubTab =
  | 'team'
  | 'identification'
  | 'documents'
  | 'assets'
  | 'directory'
  | 'campaigns';

interface BrandHubViewProps {
  initialTab?: BrandHubTab;
  campaignsMode?: boolean;
}

export const BrandHubView: React.FC<BrandHubViewProps> = ({
  initialTab = 'team',
  campaignsMode = false,
}) => {
  const state = useStudioStore();
  const activeStore = getCoagroStoreById(state.activeStoreId);
  const isPet =
    state.brandKit.activeDepartmentId === 'dept-2' ||
    activeStore.bandeira === 'COAGRO_PET';

  const [activeTab, setActiveTab] = useState<BrandHubTab>(initialTab);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('camp-saldao');
  const [notice, setNotice] = useState<string | null>(null);

  // Kit Colaborador (Assinatura, Cartão de Visita e Perfil Institucional 1:1)
  const [collabName, setCollabName] = useState('Kaio Araújo');
  const [collabRole, setCollabRole] = useState('Analista de Marketing');
  const [collabDepartment, setCollabDepartment] = useState('Marketing & Comunicação');
  const [collabRegistration, setCollabRegistration] = useState('COA-001');
  const [collabPhone, setCollabPhone] = useState(activeStore.telefoneFormatado);
  const [collabEmail, setCollabEmail] = useState(activeStore.gerenteEmail);
  const [collabPhoto, setCollabPhoto] = useState<string | null>(null);
  const [profileZoom, setProfileZoom] = useState(1);
  const [profileOffsetX, setProfileOffsetX] = useState(0);
  const [profileOffsetY, setProfileOffsetY] = useState(0);
  const [profileShowBadge, setProfileShowBadge] = useState(true);

  // Papel Timbrado A4
  const [docTitle, setDocTitle] = useState('COMUNICADO OFICIAL DE FILIAL');
  const [docRecipient, setDocRecipient] = useState(
    'Aos Clientes, Produtores Rurais e Parceiros Comerciais'
  );
  const [docBody, setDocBody] = useState(
    'Informamos que, devido ao período de safra e alta demanda de plantio na região, nossa equipe técnica e atendimento de balcão estarão operando em regime especial.\n\nPara cotações diretas de defensivos, sementes, irrigação e nutrição animal, entre em contato diretamente pelo WhatsApp oficial informado no rodapé deste documento.'
  );
  const [docSigner, setDocSigner] = useState(`Gerência • ${activeStore.nome}`);

  // Filtro Diretório de Filiais
  const [storeSearch, setStoreSearch] = useState('');
  const [ufFilter, setUfFilter] = useState<'ALL' | 'AL' | 'SE' | 'BA'>('ALL');
  const [catalogSearch, setCatalogSearch] = useState('');

  const signatureRef = useRef<HTMLDivElement>(null);
  const officialBusinessCardRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const letterheadRef = useRef<HTMLDivElement>(null);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCollabPhoto(reader.result as string);
      flashNotice('✅ Foto do colaborador aplicada na Assinatura, Cartão e Avatar!');
    };
    reader.readAsDataURL(file);
  };

  // Cadastro de Novo Produto Homologado com Foto (Curador Admin)
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newPriceTo, setNewPriceTo] = useState('');
  const [newPriceFrom, setNewPriceFrom] = useState('');
  const [newUnit, setNewUnit] = useState('L');
  const [newCategory, setNewCategory] = useState<RegulatoryCategory>('STANDARD');
  const [newProductImage, setNewProductImage] = useState<string | null>(null);

  const handleProductPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewProductImage(reader.result as string);
      flashNotice('📸 Imagem do produto carregada para homologação!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newTitle.trim() || !newPriceTo.trim()) {
      flashNotice('⚠️ Preencha SKU, Nome do Produto e Preço de Venda.');
      return;
    }
    const priceToNum = parseFloat(newPriceTo.replace(',', '.'));
    if (isNaN(priceToNum) || priceToNum <= 0) {
      flashNotice('⚠️ Preço de venda inválido.');
      return;
    }
    const priceFromNum = newPriceFrom ? parseFloat(newPriceFrom.replace(',', '.')) : undefined;

    const record: ErpCatalogRecord = {
      skuCode: newSku.trim().toUpperCase(),
      rawTitle: newTitle.trim(),
      cleanedTitle: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      unit: newUnit.trim() || 'un',
      priceFrom: !isNaN(priceFromNum || NaN) ? priceFromNum : undefined,
      priceTo: priceToNum,
      regulatoryCategory: newCategory,
      productImageUrl: newProductImage || undefined,
      updatedAtISO: new Date().toISOString(),
    };

    studioActions.addCustomCatalogProduct(record);
    flashNotice(`⭐ Produto SKU ${record.skuCode} homologado com sucesso na Media Library!`);
    setNewSku('');
    setNewTitle('');
    setNewSubtitle('');
    setNewPriceTo('');
    setNewPriceFrom('');
    setNewProductImage(null);
    setShowAddProductModal(false);
  };

  const handleCopySignatureHtml = async () => {
    const accent = isPet ? '#001C71' : '#004d40';
    const html = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="width:620px;max-width:100%;border-collapse:collapse;font-family:'Inter',Arial,sans-serif;background:#001C71;color:#ffffff;">
      <tr>
        <td style="padding:22px 26px 10px;vertical-align:top;">
          <div style="font-size:24px;font-weight:800;line-height:1.05;color:#ffffff;font-family:'Exo 2',Arial,sans-serif;">${collabName}</div>
          <div style="font-size:15px;font-weight:600;color:#FFAB00;margin-top:4px;">${collabRole}</div>
          <div style="font-size:12px;line-height:1.8;color:#ffffff;margin-top:14px;">
            <div>Telefone / WhatsApp: <strong>${collabPhone}</strong></div>
            <div>E-mail: <strong>${collabEmail}</strong></div>
            <div>Instagram: <strong>@grupocoagro</strong> &nbsp;•&nbsp; Site: <strong>${COAGRO_CORPORATE_INFO.website}</strong></div>
          </div>
        </td>
        <td style="width:8px;background:${accent};" aria-hidden="true"></td>
      </tr>
      <tr>
        <td colspan="2" style="padding:10px 26px 18px;border-top:1px solid rgba(255,171,0,0.35);">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-family:'Exo 2',Arial,sans-serif;font-size:18px;font-weight:900;color:#ffffff;">Coagro</td>
              <td align="right" style="font-family:'Inter',Arial,sans-serif;font-size:10px;color:#FFAB00;font-weight:600;">${isPet ? 'Coagro Pet' : 'Grupo Coagro'} • Presente no campo e na sua vida</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
    try {
      await navigator.clipboard.writeText(html);
      flashNotice('✅ Assinatura HTML copiada para o Outlook/Webmail!');
    } catch {
      flashNotice('⚠️ Não foi possível copiar automaticamente.');
    }
  };

  const handleRequestPrintedCard = () => {
    const req = studioActions.submitMarketingRequest(
      `Solicitação de Cartão de Visita Impresso: ${collabName} (${collabRole}) — ${activeStore.nome} • Tel: ${collabPhone} • E-mail: ${collabEmail}`
    );
    flashNotice(
      `📨 Pedido ${req.protocolCode} enviado para a Fila do Curador para cotação gráfica!`
    );
  };

  const handleCopyStoreData = (store: CoagroStore) => {
    const text = `UNIDADE: ${store.nome}\nRAZÃO SOCIAL: ${store.razaoSocial}\nCNPJ: ${store.cnpj}\nENDEREÇO: ${store.endereco} - ${store.cidade}/${store.estado} (CEP: ${store.cep})\nWHATSAPP: ${store.telefoneFormatado}`;
    navigator.clipboard.writeText(text);
    flashNotice(`✅ Dados fiscais de ${store.nome} copiados!`);
  };

  const filteredStores = COAGRO_STORES.filter((s) => {
    if (s.identityEnabled === false || s.bandeira === 'RB_AGRICOLA') return false;
    const matchUf = ufFilter === 'ALL' || s.estado === ufFilter;
    const q = storeSearch.toLowerCase();
    const matchText =
      !q ||
      s.nome.toLowerCase().includes(q) ||
      s.cidade.toLowerCase().includes(q) ||
      s.cnpj.includes(q);
    return matchUf && matchText;
  });

  const agroColors = [
    { name: 'Azul Oficial Coagro (Primária Titular)', hex: '#002B49', use: 'Logotipo oficial COAGRO, fundos institucionais e contraste executivo' },
    { name: 'Verde Safra (Secundária Agro)', hex: '#004d40', use: 'Detalhes de apoio, categorias agrícolas e selos secundários' },
    { name: 'Ouro Safra (Destaque & Preço)', hex: '#ffab00', use: 'Preços promocionais, chamadas de ação e acentos' },
    { name: 'Azul Royal Pet (Coagro Pet)', hex: '#001C71', use: 'Exclusivo para unidades e departamento Coagro Pet' },
    { name: 'Azul Celeste Pet (Apoio Pet)', hex: '#4897D0', use: 'Identidade Coagro Pet e tags técnicas' },
  ];

  return (
    <div className="brand-hub-page p-4 sm:p-6 max-w-6xl mx-auto space-y-6" data-brand-system="coagro-v1">
      {notice && (
        <div className="p-3.5 rounded-2xl bg-[#004d40] text-white text-xs font-bold flex items-center justify-between shadow-md">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[#ffab00] font-black ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabeçalho e Abas do Brand Hub */}
      <div className="brand-hub-hero bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#004d40] text-[#ffab00]">
            {campaignsMode ? 'Campanhas da rede' : 'Kit de marca'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {campaignsMode ? 'Campanhas e mídia oficial' : 'Marca, pessoas e materiais'}
          </h1>
          <p className="text-xs text-slate-500">
            {campaignsMode
              ? 'Pacotes sazonais, criativos, vídeos e spots homologados para as unidades.'
              : `Perfil, assinatura, cartão, papelaria e ativos oficiais de ${isPet ? 'Coagro Pet' : 'Grupo Coagro'}.`}
          </p>
        </div>

        {!campaignsMode && (
          <div className="brand-hub-tabs flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200" role="tablist" aria-label="Categorias do Brand Hub">
            {(
              [
                { id: 'team', label: 'Kit Colaborador' },
                { id: 'identification', label: 'Crachá e cartão' },
                { id: 'documents', label: 'Papel timbrado' },
                { id: 'assets', label: 'Logos e paleta' },
                { id: 'directory', label: 'Filiais e CNPJs' },
              ] as const
            ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`brand-hub-tab px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#004d40] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
          </div>
        )}
      </div>

      {/* ABA 1: KIT CORPORATIVO DE COLABORADORES */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulário Guiado */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 border-b border-slate-100 pb-2.5">
              Dados do colaborador
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Unidade / Filial Vinculada
                </label>
                <select
                  value={state.activeStoreId}
                  onChange={(e) => {
                    studioActions.setActiveStore(e.target.value);
                    const st = getCoagroStoreById(e.target.value);
                    setCollabPhone(st.telefoneFormatado);
                    setCollabEmail(st.gerenteEmail);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                >
                  {COAGRO_STORES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nome} ({st.cidade}/{st.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={collabName}
                  onChange={(e) => setCollabName(e.target.value)}
                  maxLength={42}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Cargo / Função Oficial
                </label>
                <input
                  type="text"
                  value={collabRole}
                  onChange={(e) => setCollabRole(e.target.value)}
                  maxLength={36}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Setor / Departamento
                  </label>
                  <input
                    type="text"
                    value={collabDepartment}
                    onChange={(e) => setCollabDepartment(e.target.value)}
                    maxLength={30}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={collabRegistration}
                    onChange={(e) => setCollabRegistration(e.target.value)}
                    maxLength={16}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    value={collabPhone}
                    onChange={(e) => setCollabPhone(e.target.value)}
                    maxLength={20}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="text"
                    value={collabEmail}
                    onChange={(e) => setCollabEmail(e.target.value)}
                    maxLength={64}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Foto do Colaborador (Opcional — Sincroniza todos os materiais)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#004d40] file:text-white cursor-pointer"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-600">
                    Ajuste da foto nos materiais
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileZoom(1);
                      setProfileOffsetX(0);
                      setProfileOffsetY(0);
                    }}
                    className="text-[11px] font-bold text-[#001C71] hover:underline cursor-pointer"
                  >
                    Centralizar
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-0.5">
                    <span>Zoom</span>
                    <span className="font-mono">{Math.round(profileZoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={2.4}
                    step={0.02}
                    value={profileZoom}
                    onChange={(e) => setProfileZoom(Number(e.target.value))}
                    className="w-full accent-[#001C71] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-0.5">
                      <span>Horizontal</span>
                      <span className="font-mono">{profileOffsetX}%</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={1}
                      value={profileOffsetX}
                      onChange={(e) => setProfileOffsetX(Number(e.target.value))}
                      className="w-full accent-[#001C71] cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-0.5">
                      <span>Vertical</span>
                      <span className="font-mono">{profileOffsetY}%</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={1}
                      value={profileOffsetY}
                      onChange={(e) => setProfileOffsetY(Number(e.target.value))}
                      className="w-full accent-[#001C71] cursor-pointer"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={profileShowBadge}
                    onChange={(e) => setProfileShowBadge(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#001C71] cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    Exibir Nome e Cargo na arte de perfil
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
          {/* Prévia 1: Perfil Institucional 1:1 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="inline-flex rounded-full bg-[#001C71]/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#001C71]">
                  Template Oficial • 1080 × 1080 px
                </span>
                <h3 className="text-xs font-black uppercase text-slate-800 mt-1">
                  Prévia 1: Foto de Perfil Institucional (1:1)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  void exportElementToPng(
                    profileRef.current,
                    `perfil-institucional-${collabName.toLowerCase().replace(/\s+/g, '-') || 'coagro'}.png`,
                    1080
                  ).then(() => flashNotice('✅ Foto de perfil 1080×1080 baixada em PNG!'));
                }}
                className="px-3 py-1.5 rounded-xl bg-[#001C71] hover:bg-[#001247] text-[#ffab00] text-xs font-black cursor-pointer shrink-0"
              >
                ⬇️ Baixar PNG 1080
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex justify-center">
              <div className="w-full max-w-[360px]">
                <CoagroProfileTemplate
                  ref={profileRef}
                  activeStore={activeStore}
                  name={collabName}
                  role={collabRole}
                  department={collabDepartment}
                  registration={collabRegistration}
                  phone={collabPhone}
                  email={collabEmail}
                  photo={collabPhoto}
                  zoom={profileZoom}
                  offsetX={profileOffsetX}
                  offsetY={profileOffsetY}
                  showBadge={profileShowBadge}
                  isPet={isPet}
                />
              </div>
            </div>
          </div>

          {/* Prévia 2: Assinatura de E-mail Oficial (banner horizontal) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="inline-flex rounded-full bg-[#004d40]/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#004d40]">
                  Template Oficial • Assinatura de E-mail
                </span>
                <h3 className="text-xs font-black uppercase text-slate-800 mt-1">
                  Prévia 2: Assinatura de E-mail Coagro
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopySignatureHtml}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                >
                  📋 Copiar HTML
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void exportElementToPng(
                      signatureRef.current,
                      `assinatura-email-${collabName.toLowerCase().replace(/\s+/g, '-') || 'coagro'}.png`,
                      2000
                    ).then(() => flashNotice('✅ Assinatura de e-mail baixada em PNG!'));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black cursor-pointer"
                >
                  ⬇️ Baixar PNG
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 overflow-hidden">
              <CoagroEmailSignatureTemplate
                ref={signatureRef}
                activeStore={activeStore}
                name={collabName}
                role={collabRole}
                department={collabDepartment}
                registration={collabRegistration}
                phone={collabPhone}
                email={collabEmail}
                photo={collabPhoto}
                zoom={profileZoom}
                offsetX={profileOffsetX}
                offsetY={profileOffsetY}
                isPet={isPet}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              A exportação usa o mesmo motor dos materiais do Hub, preservando margens e proporções.
            </p>
          </div>
          </div>
        </div>
      )}

      {/* ABA 1B: IDENTIFICAÇÃO OFICIAL — CRACHÁ E CARTÃO */}
      {activeTab === 'identification' && (
        <div className="brand-hub-identity space-y-6">
          <div className="brand-hub-panel rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="brand-hub-kicker">Identificação oficial · modelos homologados</span>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                  Crachá e cartão
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                  A composição é travada. Nome, cargo, foto e contatos vêm do Kit Colaborador,
                  evitando cadastro duplicado.
                </p>
              </div>
              <span className="brand-hub-status">2 modelos oficiais</span>
            </div>

            <div className="brand-hub-identity-summary mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="brand-hub-kicker">Colaborador</span>
                <strong className="mt-1 block truncate text-base font-black text-slate-900">
                  {collabName}
                </strong>
                <span className="block truncate text-xs text-slate-500">
                  {collabRole} · {collabDepartment}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-500">
                <span>Matrícula <strong className="font-mono text-slate-800">{collabRegistration}</strong></span>
                <span>{collabPhone}</span>
                <span className="hidden sm:inline">{collabEmail}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className="brand-hub-action brand-hub-action--muted"
                >
                  Editar no Kit Colaborador
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <section className="brand-hub-template-card rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <span className="brand-hub-kicker">Modelo 01 · vertical</span>
                    <h3 className="mt-1 text-sm font-black text-slate-900">Crachá corporativo</h3>
                  </div>
                  <span className="brand-hub-locked">Travado</span>
                </div>
                <div className="flex justify-center">
                  <CoagroBadgeTemplate
                    ref={badgeRef}
                    activeStore={activeStore}
                    name={collabName}
                    role={collabRole}
                    department={collabDepartment}
                    registration={collabRegistration}
                    phone={collabPhone}
                    email={collabEmail}
                    photo={collabPhoto}
                    isPet={isPet}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    exportElementToPng(
                      badgeRef.current,
                      `cracha-${collabName.toLowerCase().replace(/\s+/g, '-') || 'coagro'}.png`,
                      1200
                    )
                  }
                  className="brand-hub-action mt-4 w-full"
                >
                  ↓ Baixar crachá PNG
                </button>
              </section>

              <section className="brand-hub-template-card rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <span className="brand-hub-kicker">Modelo 02 · 9 × 5 cm</span>
                    <h3 className="mt-1 text-sm font-black text-slate-900">Cartão de visita oficial</h3>
                  </div>
                  <span className="brand-hub-locked">Travado</span>
                </div>
                <div className="flex min-h-[230px] items-center justify-center rounded-xl bg-[#f3f6f7] p-4">
                  <CoagroBusinessCardTemplate
                    ref={officialBusinessCardRef}
                    activeStore={activeStore}
                    name={collabName}
                    role={collabRole}
                    department={collabDepartment}
                    registration={collabRegistration}
                    phone={collabPhone}
                    email={collabEmail}
                    photo={collabPhoto}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      exportElementToPng(
                        officialBusinessCardRef.current,
                        `cartao-${collabName.toLowerCase().replace(/\s+/g, '-') || 'coagro'}.png`,
                        1200
                      )
                    }
                    className="brand-hub-action flex-1"
                  >
                    ↓ Baixar cartão PNG
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestPrintedCard}
                    className="brand-hub-action brand-hub-action--muted flex-1"
                  >
                    📨 Solicitar gráfica
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: PAPEL TIMBRADO A4 OFICIAL */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-900">
              Papel Timbrado &amp; Ofícios A4 ({activeStore.nome})
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Título do Documento
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Destinatário / Vocativo
                </label>
                <input
                  type="text"
                  value={docRecipient}
                  onChange={(e) => setDocRecipient(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Corpo do Comunicado / Ofício
                </label>
                <textarea
                  rows={5}
                  value={docBody}
                  onChange={(e) => setDocBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Assinatura Responsável
                </label>
                <input
                  type="text"
                  value={docSigner}
                  onChange={(e) => setDocSigner(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    printOrSaveA4Sheet(
                      letterheadRef.current,
                      `Papel_Timbrado_${activeStore.id}`
                    )
                  }
                  className="flex-1 py-2.5 rounded-xl bg-[#004d40] text-[#ffab00] text-xs font-black uppercase cursor-pointer"
                >
                  🖨️ Imprimir / Salvar PDF A4
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex justify-center">
            <div
              ref={letterheadRef}
              className="w-full max-w-[520px] aspect-[210/297] bg-white rounded-2xl border border-slate-300 shadow-md p-8 flex flex-col justify-between text-slate-800"
            >
              {/* Cabeçalho Timbrado */}
              <div className="flex items-center justify-between border-b-2 border-[#004d40] pb-4">
                <LogoHorizontalAzul className="h-10 w-auto" />
                <div className="text-right text-[10px] text-slate-500">
                  <div className="font-black text-slate-800 uppercase">{activeStore.nome}</div>
                  <div>CNPJ: {activeStore.cnpj}</div>
                  <div>{activeStore.cidade} - {activeStore.estado}</div>
                </div>
              </div>

              {/* Corpo */}
              <div className="my-auto py-6 space-y-4">
                <div className="text-xs text-slate-400">
                  {activeStore.cidade}/{activeStore.estado}, {new Date().toLocaleDateString('pt-BR')}
                </div>
                <h3 className="text-base font-black text-[#004d40] uppercase">{docTitle}</h3>
                <div className="text-xs font-bold text-slate-700">{docRecipient},</div>
                <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                  {docBody}
                </p>
                <div className="pt-8">
                  <div className="w-48 border-t border-slate-400 pt-1.5 text-xs font-black text-slate-900">
                    {docSigner}
                  </div>
                  <div className="text-[10px] text-slate-500">{activeStore.razaoSocial}</div>
                </div>
              </div>

              {/* Rodapé Oficial */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-500">
                <span>
                  {activeStore.endereco} • CEP {activeStore.cep} • {activeStore.cidade}/{activeStore.estado}
                </span>
                <span className="font-bold text-[#004d40]">
                  WhatsApp: {activeStore.telefoneFormatado} • {COAGRO_CORPORATE_INFO.website}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: LOGOS VETORIAIS & PALETA TRAVADA */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
              <div className="h-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                <LogoHorizontalAzul className="max-h-14 w-auto" />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black uppercase text-slate-900">
                  Logo Horizontal Oficial (Fundo Claro)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Uso padrão em documentos A4, cabeçalhos e fundos brancos.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
              <div className="h-28 rounded-xl bg-[#004d40] flex items-center justify-center p-4">
                <LogoHorizontalBranca className="max-h-14 w-auto" />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black uppercase text-slate-900">
                  Logo Horizontal Branca (Fundo Verde/Azul)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Uso obrigatório sobre fundos escuros institucionais (#004d40 e #001C71).
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
              <div className="h-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                <CoagroSimboloCasinha className="w-16 h-16" />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black uppercase text-slate-900">
                  Símbolo Casinha Coagro (Ícone / Avatar)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Favicon, selo de perfil de WhatsApp e marca d&apos;água oficial.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="text-xs font-black uppercase text-slate-900 mb-3">
              Paleta Institucional Travada (Proibido Misturar Agro com Pet)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {agroColors.map((c) => (
                <div
                  key={c.hex}
                  className="p-3.5 rounded-xl border border-slate-200 space-y-2"
                >
                  <div
                    className="h-12 rounded-lg border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="text-xs font-black text-slate-900">{c.name}</div>
                  <div className="font-mono text-xs font-bold text-[#004d40]">{c.hex}</div>
                  <p className="text-[11px] text-slate-500">{c.use}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: DIRETÓRIO DAS 15 UNIDADES & CNPJS */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              placeholder="Buscar filial por cidade, nome ou CNPJ..."
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold"
            />
            <div className="flex gap-1.5">
              {(['ALL', 'AL', 'SE', 'BA'] as const).map((uf) => (
                <button
                  key={uf}
                  type="button"
                  onClick={() => setUfFilter(uf)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer ${
                    ufFilter === uf
                      ? 'bg-[#004d40] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {uf === 'ALL' ? 'Todos (AL/SE/BA)' : uf}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStores.map((st) => (
              <div
                key={st.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-900">
                      {st.nome}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                      {st.cidade}/{st.estado}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">CNPJ: {st.cnpj}</div>
                  <div className="text-[11px] text-slate-600">{st.endereco}</div>
                  <div className="text-[11px] font-bold text-[#004d40]">
                    📱 {st.telefoneFormatado} • {st.gerenteEmail}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCopyStoreData(st)}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black cursor-pointer"
                  >
                    📋 Copiar CNPJ/Endereço
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      studioActions.setActiveStore(st.id);
                      flashNotice(`🏬 Filial ativa alterada para ${st.nome}!`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#004d40] text-[#ffab00] text-[11px] font-black cursor-pointer"
                  >
                    Ativar Loja
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* 5. ABA: CAMPANHAS GLOBAIS DA REDE & MEDIA LIBRARY OFICIAL (SPRINT 3) */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Campanhas Oficiais */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  🎯 Pacotes Comerciais &amp; Campanhas Sazonais Homologadas
                </h2>
                <p className="text-xs text-slate-500">
                  Padrões corporativos do Grupo Coagro para ações de safra, saldões e finais de semana. Ao aplicar, as cores e o selo são injetados automaticamente no estúdio com os dados da filial ativa ({activeStore.nome}).
                </p>
              </div>
              {state.brandKit.activeCampaignId && (
                <button
                  type="button"
                  onClick={() => {
                    studioActions.setActiveCampaign(null);
                    flashNotice('🔄 Campanha sazonal desativada. Retornado ao tema padrão da filial.');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition shrink-0"
                >
                  ✕ Desativar Campanha Ativa
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.brandKit.seasonalCampaigns.map((camp) => {
                const isActive = state.brandKit.activeCampaignId === camp.id;
                const isSelected = selectedCampaignId === camp.id;
                return (
                  <div
                    key={camp.id}
                    onClick={() => setSelectedCampaignId(camp.id)}
                    className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition cursor-pointer ${
                      isSelected
                        ? 'border-[#002B49] bg-slate-50/80 ring-2 ring-[#002B49]/20 shadow-sm'
                        : isActive
                          ? 'border-[#ffab00] bg-amber-50/40 ring-2 ring-[#ffab00]/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-xs"
                          style={{
                            backgroundColor: camp.primaryColorHex,
                            color: camp.accentColorHex,
                            border: `1px solid ${camp.accentColorHex}40`,
                          }}
                        >
                          {camp.badgeText}
                        </span>
                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#004d40] text-[#ffab00] text-[10px] font-black uppercase">
                            Ativa no Estúdio
                          </span>
                        ) : isSelected ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase">
                            Visualizando Pacote
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-slate-900">{camp.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Paleta homologada: <span className="font-mono text-[11px] font-bold" style={{ color: camp.primaryColorHex }}>{camp.primaryColorHex}</span> / <span className="font-mono text-[11px] font-bold" style={{ color: camp.accentColorHex }}>{camp.accentColorHex}</span>
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                        <div>🔒 <strong>Governança:</strong> Tipografia Exo 2 / Inter travada</div>
                        <div>🏬 <strong>Filial:</strong> {activeStore.nome} (WhatsApp {activeStore.telefoneFormatado})</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          studioActions.applyCampaignToStudio(camp.id, 'STORE_POSTER');
                          flashNotice(`⚡ Campanha "${camp.name}" aplicada no Módulo de Cartazes PDV!`);
                        }}
                        className="py-2 px-2.5 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-[11px] font-black cursor-pointer text-center transition"
                      >
                        ⚡ Cartaz PDV
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          studioActions.applyCampaignToStudio(camp.id, 'SOCIAL_MEDIA');
                          flashNotice(`📱 Campanha "${camp.name}" aplicada no Módulo de Redes Sociais!`);
                        }}
                        className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-black cursor-pointer text-center transition"
                      >
                        📱 WhatsApp / Feed
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAINEL DINÂMICO DE ATIVOS POR CAMPANHA SELECIONADA (SPRINT C) */}
            {(() => {
              const selectedCamp =
                state.brandKit.seasonalCampaigns.find((c) => c.id === selectedCampaignId) ||
                state.brandKit.seasonalCampaigns[0];
              if (!selectedCamp) return null;

              return (
                <div className="mt-6 p-6 rounded-3xl bg-slate-50 border-2 border-slate-200/80 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-2xs"
                        style={{
                          backgroundColor: selectedCamp.primaryColorHex,
                          color: selectedCamp.accentColorHex,
                          border: `1px solid ${selectedCamp.accentColorHex}40`,
                        }}
                      >
                        {selectedCamp.badgeText}
                      </span>
                      <div>
                        <h3 className="text-base font-black text-slate-900">
                          Pacote Criativo Completo 360° — {selectedCamp.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {selectedCamp.description || 'Artes verticais, vídeos homologados por departamento e spots de rádio.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          studioActions.applyCampaignToStudio(selectedCamp.id, 'STORE_POSTER');
                          flashNotice(`⚡ Campanha "${selectedCamp.name}" aplicada no Módulo de Cartazes PDV!`);
                        }}
                        className="py-2 px-3.5 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black cursor-pointer transition shadow-2xs"
                      >
                        ⚡ Gerar Cartaz Desta Campanha
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          studioActions.applyCampaignToStudio(selectedCamp.id, 'SOCIAL_MEDIA');
                          flashNotice(`📱 Campanha "${selectedCamp.name}" aplicada no Módulo de Redes Sociais!`);
                        }}
                        className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black cursor-pointer transition shadow-2xs"
                      >
                        📱 Gerar Anúncio de Loja
                      </button>
                    </div>
                  </div>

                  {/* 1. Stories em Alta Resolução (1080x1920) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <span>📱</span> Stories Verticais Oficiais (1080×1920 PNG)
                      </h4>
                      <span className="text-[11px] text-slate-500">3 variações oficiais prontas para status</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'st-1', label: 'Story 1: Ofertas de Abertura', highlight: 'QUEIMA DE SAFRA' },
                        { id: 'st-2', label: 'Story 2: Destaques & SKUs', highlight: 'PRODUTOS SELECIONADOS' },
                        { id: 'st-3', label: 'Story 3: Atendimento Balcão', highlight: `${activeStore.nome.toUpperCase()}` },
                      ].map((st, i) => (
                        <div
                          key={st.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs"
                        >
                          <div
                            className="w-full aspect-[9/16] max-h-48 rounded-xl flex flex-col items-center justify-center p-3 text-center relative overflow-hidden"
                            style={{
                              backgroundColor: selectedCamp.primaryColorHex,
                              color: selectedCamp.accentColorHex,
                            }}
                          >
                            <div className="text-[10px] font-bold opacity-80 mb-1">STORY 0{i + 1}</div>
                            <div className="text-xs font-black leading-tight uppercase px-2">{st.highlight}</div>
                            <div className="mt-2 text-[9px] font-mono text-white/90">1080 × 1920 px</div>
                          </div>

                          <div>
                            <div className="text-xs font-bold text-slate-800">{st.label}</div>
                            <div className="text-[10px] text-slate-500">{activeStore.cidade}/{activeStore.estado}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              flashNotice(`📥 Baixando ${st.label} (1080x1920 PNG)...`);
                            }}
                            className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer"
                          >
                            📥 Baixar PNG 1080×1920
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Vídeos por Departamento */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <span>🎬</span> Vídeos Promocionais por Departamento (Reels &amp; TV de Loja)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { dept: 'Nutrição Animal', icon: '🐮', title: 'Linha Bovigold & Pastagem', dur: '0:30' },
                        { dept: 'Defensivos Agrícolas', icon: '🌾', title: 'Herbicidas & Fungicidas MAPA', dur: '0:30' },
                        { dept: 'Máquinas & Ferramentas', icon: '🚜', title: 'Equipamentos & Pulverização', dur: '0:15' },
                        { dept: 'Coagro Pet', icon: '🐾', title: 'Rações Premium & Antiparasitários', dur: '0:15' },
                      ].map((vid) => (
                        <div
                          key={vid.dept}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{vid.icon}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black font-mono">
                              {vid.dur}
                            </span>
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{vid.dept}</div>
                            <div className="text-xs font-black text-slate-900 leading-tight">{vid.title}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => flashNotice(`📥 Baixando vídeo promocional de ${vid.dept} (${vid.dur} MP4)...`)}
                            className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer"
                          >
                            📥 Baixar Vídeo MP4
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Spots de Rádio Coagro */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <span>🎙️</span> Spots da Rádio Coagro (Som Ambiente &amp; Rádio Local)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { title: `Spot 15s — ${selectedCamp.name} (Flash Rápido)`, dur: 15, file: `spot-15s-${selectedCamp.id}.mp3` },
                        { title: `Spot 30s — ${selectedCamp.name} (Chamada Completa)`, dur: 30, file: `spot-30s-${selectedCamp.id}.mp3` },
                      ].map((audio) => (
                        <div
                          key={audio.dur}
                          className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => flashNotice(`▶ Reproduzindo ${audio.title} no som ambiente...`)}
                              className="w-10 h-10 rounded-full bg-[#002B49] text-[#ffab00] flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer shadow-2xs"
                              title="Ouvir spot"
                            >
                              ▶
                            </button>
                            <div>
                              <div className="text-xs font-black text-slate-900">{audio.title}</div>
                              <div className="text-[10px] text-slate-500 font-medium">Áudio oficial homologado • {audio.dur} segundos • MP3 320kbps</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => flashNotice(`📥 Baixando ${audio.file}...`)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer shrink-0"
                          >
                            📥 Baixar MP3
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Galeria de Produtos Homologados (Media Library Coagro) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    📦 Galeria de Produtos Homologados (Media &amp; Catálogo Coagro)
                  </h2>
                  {state.userRole === 'CURATOR_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(!showAddProductModal)}
                      className="px-3 py-1 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black cursor-pointer transition shadow-2xs"
                    >
                      {showAddProductModal ? '✕ Fechar Cadastro' : '➕ Homologar Produto'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seleção rápida de SKUs homologados com fotos, títulos saneados e regras tributárias/MAPA validadas. Clique para carregar direto no estúdio.
                </p>
              </div>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="🔍 Buscar produto por SKU ou nome..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold focus:bg-white focus:border-[#004d40] outline-hidden"
                />
              </div>
            </div>

            {/* Formulário de Cadastro Rápido do Curador Admin (Sprint 8) */}
            {state.userRole === 'CURATOR_ADMIN' && showAddProductModal && (
              <form
                onSubmit={handleSaveCustomProduct}
                className="bg-amber-50/60 border border-amber-300 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">
                    ✨ Cadastrar Novo Produto Homologado com Foto PNG
                  </h3>
                  <span className="text-[11px] font-bold text-amber-900">
                    Exclusivo Curador (Kaio) • Disponível imediatamente para todas as 15 filiais
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Código / SKU *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 80992"
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-hidden focus:border-[#004d40]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Nome Comercial Limpo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Herbicida Sanson 40 SC FMC"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-hidden focus:border-[#004d40]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Categoria Regulatória
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as RegulatoryCategory)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-hidden focus:border-[#004d40]"
                    >
                      <option value="STANDARD">Agro &amp; Pet Geral</option>
                      <option value="AGRO_PESTICIDE">Agrotóxico / Defensivo (MAPA)</option>
                      <option value="VET_PRESCRIPTION">Medicamento Veterinário</option>
                      <option value="RESTRICTED_CHEMICAL">Químico Restrito</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Preço Normal (De R$)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 145,00"
                      value={newPriceFrom}
                      onChange={(e) => setNewPriceFrom(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-hidden focus:border-[#004d40]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Preço Oferta (Por R$) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 119,90"
                      value={newPriceTo}
                      onChange={(e) => setNewPriceTo(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-hidden focus:border-[#004d40]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Unidade de Medida
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: L, kg, sc 25kg, un"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-hidden focus:border-[#004d40]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Subtítulo / Princípio Ativo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Nicosulfuron 40 g/L"
                      value={newSubtitle}
                      onChange={(e) => setNewSubtitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-hidden focus:border-[#004d40]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200">
                  <div className="flex items-center gap-3">
                    <label className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
                      📷 Carregar Foto PNG (Fundo Transparente)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {newProductImage && (
                      <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                        ✓ Imagem selecionada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black cursor-pointer transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black cursor-pointer transition shadow-2xs"
                    >
                      💾 Homologar no Catálogo
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                ...state.customCatalogDb,
                ...DEFAULT_ERP_CATALOG_DB.filter(
                  (def) =>
                    !state.customCatalogDb.some(
                      (c) => c.skuCode.toLowerCase() === def.skuCode.toLowerCase()
                    )
                ),
              ].filter((item) => {
                if (!catalogSearch.trim()) return true;
                const q = catalogSearch.toLowerCase();
                return (
                  item.skuCode.toLowerCase().includes(q) ||
                  item.cleanedTitle.toLowerCase().includes(q) ||
                  item.rawTitle.toLowerCase().includes(q) ||
                  (item.subtitle && item.subtitle.toLowerCase().includes(q))
                );
              }).map((item) => {
                const isCustom = state.customCatalogDb.some(
                  (c) => c.skuCode.toLowerCase() === item.skuCode.toLowerCase()
                );
                return (
                  <div
                    key={item.skuCode}
                    className="rounded-2xl p-4 border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3 hover:border-slate-300 hover:bg-white transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-mono font-bold">
                            SKU {item.skuCode}
                          </span>
                          {isCustom && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                              ⭐ Curadoria
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                          {item.regulatoryCategory === 'AGRO_PESTICIDE'
                            ? '⚠️ Agrotóxico (MAPA)'
                            : item.regulatoryCategory === 'VET_PRESCRIPTION'
                              ? '🩺 Veterinário'
                              : 'Agro & Pet Geral'}
                        </span>
                      </div>

                      {item.productImageUrl && (
                        <div className="w-full h-28 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-2">
                          <img
                            src={item.productImageUrl}
                            alt={item.cleanedTitle}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug">
                          {item.cleanedTitle}
                        </h4>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        {item.priceFrom && (
                          <span className="text-[11px] text-slate-400 line-through">
                            R$ {formatBRL(item.priceFrom)}
                          </span>
                        )}
                        <span className="text-base font-black text-[#004d40]">
                          R$ {formatBRL(item.priceTo)}
                          <span className="text-xs text-slate-500 font-semibold">/{item.unit}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        studioActions.applyCatalogRecord(item);
                        studioActions.setActiveModule('STORE_POSTER');
                        flashNotice(`✅ SKU ${item.skuCode} (${item.cleanedTitle}) carregado no Estúdio de Cartazes!`);
                      }}
                      className="w-full py-2 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black cursor-pointer transition shadow-2xs"
                    >
                      ⚡ Carregar no Estúdio
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
