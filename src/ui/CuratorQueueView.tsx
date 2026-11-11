// src/ui/CuratorQueueView.tsx
// Seções 5, 6 e 9 da Especificação: Fila de Curadoria Centralizada (Painel do Curador — Kaio) + Dicionário Corporativo Agro

import React, { useState } from 'react';
import { useStudioStore, studioActions } from '../core/store';
import { COAGRO_STORES } from '../core/coagroStores';
import {
  DEFAULT_AGRO_DICTIONARY,
  type AgroDictionaryCategory,
} from '../core/coagroDictionary';
import type { MarketingRequestStatus, ModuleMode } from '../core/types';
import { publishAudioToSpotifast } from '../utils/spotifastBridge';
import { getCloudSyncStatus } from '../core/cloudSync';

const STATUS_META: Record<
  MarketingRequestStatus,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: 'Pendente de Aprovação',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  QUOTING: {
    label: 'Em Cotação Gráfica',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  APPROVED: {
    label: 'Aprovado & Liberado',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  NEEDS_REVISION: {
    label: 'Ajuste Solicitado',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  REJECTED: {
    label: 'Recusado',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
  },
};

const MODULE_LABELS: Record<ModuleMode, string> = {
  STORE_POSTER: 'Cartaz de PDV',
  SOCIAL_MEDIA: 'Anúncio WhatsApp / Feed',
  CAROUSEL: 'Carrossel de Ofertas',
  HR_NOTICE: 'Comunicado / RH',
  BANNER_FAIXA: 'Faixa / Lona / Gráfica',
  RADIO_SPOT: 'Spot Rádio Coagro',
  BRAND_HUB: 'Kit Corporativo / Marca',
  CAMPAIGNS: 'Campanha / Mídia Oficial',
  CURATOR_QUEUE: 'Fila do Curador',
};

const CATEGORY_LABELS: Record<AgroDictionaryCategory, string> = {
  BRAND_PARTNER: '1. Marcas & Fornecedores',
  COMMERCIAL_LINE: '2. Produtos & Linhas Comerciais',
  ACTIVE_INGREDIENT: '3. Princípios Ativos & Técnicos',
  CULTIVAR_REGIONAL: '4. Cultivares, Sementes & Regionalismos',
};

export const CuratorQueueView: React.FC = () => {
  const state = useStudioStore();
  const { marketingRequests, customAgroDictionary, userRole } = state;

  const [storeFilter, setStoreFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [newTermText, setNewTermText] = useState('');
  const [newTermCategory, setNewTermCategory] =
    useState<AgroDictionaryCategory>('COMMERCIAL_LINE');
  const [notice, setNotice] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<Record<string, File>>({});
  const [isPublishingAudio, setIsPublishingAudio] = useState<Record<string, boolean>>({});
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const cloudInfo = getCloudSyncStatus();

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const filteredRequests = marketingRequests.filter((req) => {
    const matchStore = storeFilter === 'ALL' || req.storeId === storeFilter;
    const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchStore && matchStatus;
  });

  const pendingCount = marketingRequests.filter((r) => r.status === 'PENDING').length;
  const quotingCount = marketingRequests.filter((r) => r.status === 'QUOTING').length;
  const approvedCount = marketingRequests.filter((r) => r.status === 'APPROVED').length;
  const unknownWordAlerts = marketingRequests.reduce(
    (acc, r) => acc + r.unknownDictionaryTerms.length,
    0
  );

  const allDictionaryEntries = [...DEFAULT_AGRO_DICTIONARY, ...customAgroDictionary];

  const handleAddTermManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermText.trim()) return;
    studioActions.addAgroDictionaryTerm(newTermText.trim(), newTermCategory);
    flashNotice(`✅ Termo "${newTermText.trim()}" homologado no Dicionário Corporativo Coagro!`);
    setNewTermText('');
  };

  const exportRequestsToCsv = () => {
    if (filteredRequests.length === 0) {
      flashNotice('⚠️ Nenhuma solicitação na fila para exportar.');
      return;
    }
    const headers = ['Protocolo', 'Data', 'Filial', 'Modulo', 'Titulo', 'Via', 'Status'];
    const rows = filteredRequests.map((req) => {
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      return [
        escape(req.protocolCode || req.id),
        escape(new Date(req.createdAtISO).toLocaleString('pt-BR')),
        escape(req.storeName),
        escape(MODULE_LABELS[req.moduleType] || req.moduleType),
        escape(req.title),
        escape(req.governanceTrack === 'YELLOW_CURATOR' ? 'Curadoria Obrigatória' : 'Aprovação Direta'),
        escape(STATUS_META[req.status]?.label || req.status),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_curadoria_coagro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    flashNotice(`📊 Relatório CSV exportado com sucesso (${filteredRequests.length} registros)!`);
  };

  return (
    <div className="curator-page p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Banner de Feedback */}
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

      {/* Cabeçalho Executivo da Curadoria */}
      <div className="curator-hero bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#004d40] text-[#ffab00]">
            Curadoria Centralizada • Marketing Coagro
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
            Fila Global de Demandas &amp; Homologação de Marca
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auditoria centralizada de peças das 15 Unidades Coagro (Grupo Coagro e Coagro Pet), cotações gráficas e spots da Rádio Coagro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Cloud & Botão de Sincronização */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold bg-slate-50 border-slate-200">
            <span className={cloudInfo.isConfigured ? 'text-emerald-700' : 'text-slate-500'}>
              {cloudInfo.isConfigured ? '☁️ Cloud Ativa' : '💾 Modo Local (Offline)'}
            </span>
            <button
              type="button"
              disabled={isSyncingCloud}
              onClick={async () => {
                setIsSyncingCloud(true);
                try {
                  const res = await studioActions.syncCloudData();
                  if (res.synced) {
                    flashNotice(`🔄 Nuvem sincronizada! ${res.requestsCount} pedidos e ${res.dictCount} termos atualizados.`);
                  } else {
                    flashNotice(`💾 Sincronização local (${res.reason === 'unconfigured' ? 'Sem credenciais Supabase no .env' : res.reason}).`);
                  }
                } finally {
                  setIsSyncingCloud(false);
                }
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-black cursor-pointer transition disabled:opacity-50"
              title="Sincronizar fila com banco compartilhado Supabase"
            >
              {isSyncingCloud ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
            </button>
          </div>

          {/* Botão de Exportação CSV (Sprint 8) */}
          <button
            type="button"
            onClick={exportRequestsToCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
            title="Exportar planilha CSV das solicitações filtradas"
          >
            📊 Exportar Relatório CSV
          </button>

          {userRole !== 'CURATOR_ADMIN' ? (
            <button
              type="button"
              onClick={() => {
                studioActions.setUserRole('CURATOR_ADMIN');
                flashNotice('🔓 Modo Curador Admin (Kaio) ativado com alçada total de aprovação e exportação.');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black uppercase tracking-wider cursor-pointer transition shadow-xs"
            >
              🔓 Assumir Perfil Curador (Kaio)
            </button>
          ) : (
            <span className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black">
              ✅ Logado como Curador Admin (Kaio)
            </span>
          )}
        </div>
      </div>

      {/* KPIs da Rede */}
      <div className="curator-ledger grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-500">Pendentes na Fila</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <span className="text-[11px] text-slate-400">Aguardando 1 clique</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-500">Em Cotação Gráfica</span>
          <div className="text-2xl font-black text-sky-700 mt-1">{quotingCount}</div>
          <span className="text-[11px] text-slate-400">Faixas, lonas e cartões</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-500">Alertas Ortográficos</span>
          <div className="text-2xl font-black text-orange-600 mt-1">{unknownWordAlerts}</div>
          <span className="text-[11px] text-slate-400">Camada 2 (Dicionário Agro)</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-500">Peças Homologadas</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</div>
          <span className="text-[11px] text-slate-400">Liberadas para as filiais</span>
        </div>
      </div>

      {/* Filtros por Filial e Status */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-black uppercase text-slate-600 mr-1">Filial:</label>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
          >
            <option value="ALL">Todas as 15 Unidades Coagro</option>
            {COAGRO_STORES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.nome} ({st.cidade}/{st.estado})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'PENDING', 'QUOTING', 'APPROVED', 'NEEDS_REVISION'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#004d40] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Todos Status' : STATUS_META[st].label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Solicitações das Lojas */}
      <div className="space-y-3.5">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
            Nenhuma solicitação encontrada para o filtro selecionado.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const stMeta = STATUS_META[req.status];
            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-[#ffab00] font-mono text-xs font-black">
                      {req.protocolCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/10 text-[#004d40] text-xs font-black">
                      {req.storeName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      {MODULE_LABELS[req.moduleType] || req.moduleType}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Solicitante: {req.requesterEmail}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black border self-start sm:self-auto ${stMeta.badgeClass}`}
                  >
                    {stMeta.label}
                  </span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-900">{req.title}</h3>
                    <p className="text-xs font-semibold text-slate-600">
                      {req.subtitleOrSummary}
                    </p>

                    {req.guardrailWarnings.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {req.guardrailWarnings.map((w, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-lg font-medium"
                          >
                            ⚠️ {w}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Camada 2: Termos fora do Dicionário Corporativo Agro */}
                    {req.unknownDictionaryTerms.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs font-black text-orange-950">
                          📖 Vistoria Ortográfica (Termo fora da Whitelist Agro):
                        </span>
                        {req.unknownDictionaryTerms.map((term) => (
                          <span
                            key={term}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-orange-300 text-xs font-bold text-orange-900"
                          >
                            “{term}”
                            <button
                              type="button"
                              onClick={() => {
                                studioActions.addAgroDictionaryTerm(term, 'COMMERCIAL_LINE');
                                flashNotice(
                                  `✅ "${term}" adicionado oficialmente ao Dicionário Corporativo Coagro!`
                                );
                              }}
                              className="px-2 py-0.5 rounded bg-[#004d40] text-[#ffab00] text-[10px] font-black hover:bg-[#00382e] cursor-pointer"
                              title="Homologar grafia oficial no Dicionário Coagro"
                            >
                              + Adicionar ao Dicionário Coagro
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {req.curatorNotes && (
                      <p className="text-xs text-sky-900 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl mt-1">
                        <strong>Nota do Curador:</strong> {req.curatorNotes}
                      </p>
                    )}
                  </div>

                  {/* Ações Rápidas do Curador */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        studioActions.loadMarketingRequestIntoStudio(req.id);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black cursor-pointer transition"
                    >
                      ✏️ Abrir no Estúdio &amp; Revisar
                    </button>

                    {req.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => {
                          studioActions.updateMarketingRequestStatus(
                            req.id,
                            'APPROVED',
                            'Homologado pelo Curador (Kaio Virgínio) — Liberado para a loja.'
                          );
                          flashNotice(
                            `✅ ${req.protocolCode} (${req.storeName}) aprovado e liberado para download na loja!`
                          );
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black cursor-pointer transition"
                      >
                        ✅ Aprovar com 1 Clique
                      </button>
                    )}

                    {req.status !== 'QUOTING' && req.moduleType === 'BANNER_FAIXA' && (
                      <button
                        type="button"
                        onClick={() => {
                          studioActions.updateMarketingRequestStatus(
                            req.id,
                            'QUOTING',
                            'Em cotação com fornecedor gráfico homologado.'
                          );
                          flashNotice(`📐 ${req.protocolCode} movido para Em Cotação Gráfica.`);
                        }}
                        className="px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold cursor-pointer transition"
                      >
                        📐 Em Cotação
                      </button>
                    )}

                    {req.status !== 'NEEDS_REVISION' && (
                      <button
                        type="button"
                        onClick={() => {
                          studioActions.updateMarketingRequestStatus(
                            req.id,
                            'NEEDS_REVISION',
                            'Favor revisar preço/estoque antes da liberação.'
                          );
                          flashNotice(`↩️ Solicitação ${req.protocolCode} devolvida para ajuste.`);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
                      >
                        ↩️ Pedir Ajuste
                      </button>
                    )}
                  </div>
                </div>

                {/* Módulo Especial: Upload e Disparo Direto para o Spotifast Server (:8790) */}
                {req.moduleType === 'RADIO_SPOT' && (
                  <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-900 text-white space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#ffab00] text-slate-950 font-black text-[10px] uppercase tracking-wider">
                          Rádio Coagro (:8790)
                        </span>
                        <span className="text-xs text-slate-300">
                          Prioridade: <strong>{req.payloadJson.radioSpot?.priority || 1}x</strong> • Lojas:{' '}
                          <strong>{req.payloadJson.radioSpot?.targetStoreIds?.length || 1}</strong>
                        </span>
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer border border-slate-700 transition">
                        <span>{audioFiles[req.id] ? `🎵 ${audioFiles[req.id].name}` : '📁 Selecionar Gravação .mp3'}</span>
                        <input
                          type="file"
                          accept=".mp3,audio/mpeg,audio/mp3"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAudioFiles((prev) => ({ ...prev, [req.id]: file }));
                            }
                          }}
                        />
                      </label>
                    </div>

                    {req.payloadJson.radioSpot?.scriptText && (
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 italic font-sans leading-relaxed">
                        "{req.payloadJson.radioSpot.scriptText}"
                      </div>
                    )}

                    {/* Player de Pré-Escuta de Áudio MP3 (Sprint 6) */}
                    {audioFiles[req.id] && (
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                          <span>🎧 Pré-Escuta da Locução:</span>
                          <span className="text-amber-400 font-mono">{audioFiles[req.id].name}</span>
                        </div>
                        <audio
                          controls
                          src={URL.createObjectURL(audioFiles[req.id])}
                          className="w-full h-8 rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        disabled={isPublishingAudio[req.id]}
                        onClick={async () => {
                          const file = audioFiles[req.id];
                          if (!file) {
                            flashNotice('⚠️ Selecione um arquivo de áudio .mp3 antes de publicar no Spotifast!');
                            return;
                          }
                          setIsPublishingAudio((prev) => ({ ...prev, [req.id]: true }));
                          try {
                            const result = await publishAudioToSpotifast({
                              audioFile: file,
                              title: req.title,
                              productOrSubject: req.payloadJson.radioSpot?.productOrSubject,
                              targetStoreIds: req.payloadJson.radioSpot?.targetStoreIds || [req.storeId],
                              priority: req.payloadJson.radioSpot?.priority || 1,
                              durationSeconds: req.payloadJson.radioSpot?.durationSeconds || 30,
                              protocolCode: req.protocolCode,
                            });
                            studioActions.updateMarketingRequestStatus(
                              req.id,
                              'APPROVED',
                              `📻 Publicado no Spotifast Server (:8790) • Áudio: ${file.name}`,
                              result.audioUrl
                            );
                            flashNotice(
                              result.simulated
                                ? `📻 Spot publicado [Simulado]: ${file.name}`
                                : `📻 Spot publicado com sucesso na Rádio Coagro (:8790)!`
                            );
                          } finally {
                            setIsPublishingAudio((prev) => ({ ...prev, [req.id]: false }));
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-sm transition disabled:opacity-50"
                      >
                        {isPublishingAudio[req.id] ? '⏳ Enviando...' : '📻 Publicar na Rádio Coagro (:8790)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Seção 9.3: Gestão do Dicionário Corporativo Agro (Whitelist Coagro) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              📖 Dicionário Corporativo Agro (`agro_dictionary` — Whitelist Coagro)
            </h2>
            <p className="text-xs text-slate-500">
              Evita falsos positivos em princípios ativos, cultivares e marcas parceiras, corrigindo automaticamente erros de digitação do ERP.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#004d40] text-xs font-black self-start sm:self-auto">
            {allDictionaryEntries.length} Termos Homologados
          </span>
        </div>

        <form onSubmit={handleAddTermManual} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={newTermText}
            onChange={(e) => setNewTermText(e.target.value)}
            placeholder="Novo termo oficial (ex: Fluralaner, Brachiaria humidicola, Agrosalles)..."
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900"
          />
          <select
            value={newTermCategory}
            onChange={(e) =>
              setNewTermCategory(e.target.value as AgroDictionaryCategory)
            }
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
          >
            {(Object.keys(CATEGORY_LABELS) as AgroDictionaryCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            + Homologar Termo
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {(Object.keys(CATEGORY_LABELS) as AgroDictionaryCategory[]).map((cat) => {
            const items = allDictionaryEntries.filter((e) => e.category === cat);
            return (
              <div
                key={cat}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="text-xs font-black text-slate-800 uppercase">
                  {CATEGORY_LABELS[cat]} ({items.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span
                      key={item.id}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700"
                    >
                      {item.canonicalTerm}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
