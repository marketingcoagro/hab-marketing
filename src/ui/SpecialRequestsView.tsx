// src/ui/SpecialRequestsView.tsx
// Módulo 2 (Faixas, Banners e Lonas) & Módulo 5 (Anúncios da Rádio Interna — Rádio Coagro / Spotifast :8790)

import React, { useState } from 'react';
import { useStudioStore, studioActions } from '../core/store';
import { COAGRO_STORES, getCoagroStoreById } from '../core/coagroStores';
import {
  estimateRadioSpotTiming,
  inspectAgroOrthography,
} from '../core/businessRules';
import { LogoHorizontalBranca } from './coagroLogos';

interface SpecialRequestsViewProps {
  mode: 'BANNER_FAIXA' | 'RADIO_SPOT';
}

export const SpecialRequestsView: React.FC<SpecialRequestsViewProps> = ({ mode }) => {
  const state = useStudioStore();
  const { bannerFaixaDraft, radioSpotDraft, customAgroDictionary, activeStoreId } = state;
  const activeStore = getCoagroStoreById(activeStoreId);
  const [notice, setNotice] = useState<string | null>(null);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  if (mode === 'BANNER_FAIXA') {
    const ortho = inspectAgroOrthography(
      `${bannerFaixaDraft.campaignTitle} ${bannerFaixaDraft.featuredProductOrPartner}`,
      customAgroDictionary
    );

    const aspect = Math.max(
      1.2,
      Math.min(4.5, bannerFaixaDraft.widthCm / Math.max(1, bannerFaixaDraft.heightCm))
    );

    return (
      <div className="special-page p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Formulário de Faixa/Lona */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                Via Amarela • Cotação Gráfica Obrigatória
              </span>
              <h1 className="text-lg font-black text-slate-900 mt-1">
                Faixas, banners e lonas de loja
              </h1>
              <p className="text-xs text-slate-500">
                Preencha as medidas da fachada ou evento. O sistema gera o gabarito proporcional e encaminha para cotação gráfica no Marketing.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Tipo de Material Físico
                </label>
                <select
                  value={bannerFaixaDraft.pieceType}
                  onChange={(e) =>
                    studioActions.updateBannerFaixaDraft({
                      pieceType: e.target.value as typeof bannerFaixaDraft.pieceType,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                >
                  <option value="LONA_FACHADA">Lona de Fachada com Ilhós (440g)</option>
                  <option value="FAIXA_RUA">Faixa de Rua / Ação Sazonal (300×70cm)</option>
                  <option value="BANNER_ILHOS">Banner Vertical de Balcão / Feira (80×120cm)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Largura (cm)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={1200}
                    value={bannerFaixaDraft.widthCm}
                    onChange={(e) =>
                      studioActions.updateBannerFaixaDraft({
                        widthCm: Number(e.target.value) || 300,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={600}
                    value={bannerFaixaDraft.heightCm}
                    onChange={(e) =>
                      studioActions.updateBannerFaixaDraft({
                        heightCm: Number(e.target.value) || 100,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={bannerFaixaDraft.quantity}
                    onChange={(e) =>
                      studioActions.updateBannerFaixaDraft({
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Título da Campanha / Ação
                </label>
                <input
                  type="text"
                  value={bannerFaixaDraft.campaignTitle}
                  onChange={(e) =>
                    studioActions.updateBannerFaixaDraft({
                      campaignTitle: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Produto ou Fornecedor Parceiro em Destaque
                </label>
                <input
                  type="text"
                  value={bannerFaixaDraft.featuredProductOrPartner}
                  onChange={(e) =>
                    studioActions.updateBannerFaixaDraft({
                      featuredProductOrPartner: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Chamada de Preço / Condição (Opcional)
                </label>
                <input
                  type="text"
                  value={bannerFaixaDraft.priceText || ''}
                  onChange={(e) =>
                    studioActions.updateBannerFaixaDraft({
                      priceText: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                />
              </div>

              {ortho.unknownTerms.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900">
                  <strong>⚠️ Vistoria Ortográfica (Camada 1):</strong> Termos fora do Dicionário Agro detectados:{' '}
                  <span className="font-mono font-bold">
                    {ortho.unknownTerms.join(', ')}
                  </span>
                  . O Curador revisará antes do envio para a gráfica.
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const req = studioActions.submitMarketingRequest(bannerFaixaDraft.notes);
                  flashNotice(
                    `✅ Solicitação ${req.protocolCode} enviada para Cotação Gráfica e Curadoria!`
                  );
                }}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-xs cursor-pointer"
              >
                📐 Solicitar Criação &amp; Cotação ao Marketing
              </button>
            </div>
          </div>

          {/* Coluna Direita: Mockup Proporcional Travado */}
          <div className="special-stage-card lg:col-span-7 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-700">
                Mockup Proporcional ({bannerFaixaDraft.widthCm}×{bannerFaixaDraft.heightCm}cm • {bannerFaixaDraft.quantity} un.)
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-600">
                Preview com Trava de Download
              </span>
            </div>

            <div className="my-auto py-6 flex items-center justify-center">
              <div
                onContextMenu={(e) => e.preventDefault()}
                style={{ aspectRatio: `${aspect} / 1` }}
                className="special-mockup w-full rounded-2xl bg-[#004d40] border-4 border-[#ffab00] p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-lg select-none"
              >
                {/* Marca d'água de revisão */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045] rotate-[-12deg] text-2xl font-black uppercase tracking-widest text-white">
                  PREVIEW DE COTAÇÃO • {activeStore.nome}
                </div>

                <div className="flex items-center justify-between z-10">
                  <LogoHorizontalBranca className="h-8 w-auto" />
                  <span className="px-3 py-1 rounded-full bg-[#ffab00] text-slate-950 text-[10px] font-black uppercase">
                    {activeStore.nome} • {activeStore.cidade}/{activeStore.estado}
                  </span>
                </div>

                <div className="z-10 my-2">
                  <div className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                    {bannerFaixaDraft.campaignTitle}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#ffab00] mt-1">
                    {bannerFaixaDraft.featuredProductOrPartner}
                  </div>
                </div>

                <div className="z-10 flex items-center justify-between border-t border-white/20 pt-2.5 text-[11px]">
                  <span className="font-black text-[#ffab00]">
                    {bannerFaixaDraft.priceText || 'Consulte condições na loja'}
                  </span>
                  <span className="text-white/90 font-semibold">
                    📍 {activeStore.endereco} • 📱 {activeStore.telefoneFormatado}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              O arquivo final em CMYK/PDF com sangria e marca de ilhós é fechado pelo Marketing após aprovação do orçamento gráfico.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MÓDULO 5: ANÚNCIOS DA RÁDIO INTERNA (RÁDIO COAGRO / SPOTIFAST :8790)
  const timing = estimateRadioSpotTiming(
    radioSpotDraft.scriptText,
    radioSpotDraft.durationSeconds
  );

  const toggleStoreTarget = (storeId: string) => {
    const exists = radioSpotDraft.targetStoreIds.includes(storeId);
    const next = exists
      ? radioSpotDraft.targetStoreIds.filter((id) => id !== storeId)
      : [...radioSpotDraft.targetStoreIds, storeId];

    if (radioSpotDraft.mentionStoreName !== false) {
      const nextMentionedStoreId = exists ? next[0] || activeStore.id : storeId;
      studioActions.setActiveStore(nextMentionedStoreId);
      return;
    }

    studioActions.updateRadioSpotDraft({
      targetStoreIds: next.length > 0 ? next : [activeStore.id],
    });
  };

  return (
    <div className="special-page p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Parâmetros do Spot */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#004d40] text-[10px] font-black uppercase">
              Integração Rádio Coagro • Spotifast Server (:8790)
            </span>
            <h1 className="text-lg font-black text-slate-900 mt-1">
              Solicitação de spot para rádio interna
            </h1>
            <p className="text-xs text-slate-500">
              Estruture o aviso ou oferta para a programação musical das lojas (regra 2 músicas : 1 comercial).
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Tipo de Aviso
                </label>
                <select
                  value={radioSpotDraft.spotType}
                  onChange={(e) =>
                    studioActions.updateRadioSpotDraft({
                      spotType: e.target.value as typeof radioSpotDraft.spotType,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                >
                  <option value="PRODUCT_OFFER">Oferta de Produto / Balcão</option>
                  <option value="STORE_HOURS">Comunicado de Horário / Plantão</option>
                  <option value="SUPPLIER_CAMPAIGN">Campanha de Fornecedor Parceiro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Duração Alvo &amp; Peso
                </label>
                <div className="flex gap-1.5">
                  {([15, 30] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() =>
                        studioActions.updateRadioSpotDraft({ durationSeconds: sec })
                      }
                      className={`flex-1 py-2 rounded-xl text-xs font-black cursor-pointer ${
                        radioSpotDraft.durationSeconds === sec
                          ? 'bg-[#004d40] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      studioActions.updateRadioSpotDraft({
                        priority: radioSpotDraft.priority === 2 ? 1 : 2,
                      })
                    }
                    className={`px-2.5 py-2 rounded-xl text-xs font-black cursor-pointer ${
                      radioSpotDraft.priority === 2
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                    title="Prioridade de rotação no Spotifast Server"
                  >
                    ⭐ {radioSpotDraft.priority}x
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                Produto em Oferta ou Assunto do Comunicado
              </label>
              <input
                type="text"
                value={radioSpotDraft.productOrSubject}
                onChange={(e) =>
                  studioActions.updateRadioSpotDraft({
                    productOrSubject: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                Preço ou Condição Falada na Locução
              </label>
              <input
                type="text"
                value={radioSpotDraft.priceText || ''}
                onChange={(e) =>
                  studioActions.updateRadioSpotDraft({
                    priceText: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={radioSpotDraft.mentionStoreName !== false}
                  onChange={(e) => {
                    studioActions.updateRadioSpotDraft({ mentionStoreName: e.target.checked });
                  }}
                  className="rounded border-slate-300 text-[#002B49] focus:ring-[#ffab00]"
                />
                <span>Mencionar o nome da minha loja no áudio?</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1 pl-6">
                {radioSpotDraft.mentionStoreName !== false
                  ? `Se ativado, a locução cita "Aqui na ${activeStore.nome}".`
                  : 'Se desativado, a locução cita "todas as lojas do Grupo Coagro".'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                studioActions.autoGenerateRadioSpotScript();
                flashNotice('🎙️ Roteiro cronometrado gerado automaticamente para a loja!');
              }}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
            >
              ⚡ Gerar Rascunho de Roteiro Padronizado ({radioSpotDraft.durationSeconds}s)
            </button>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">
                Lojas Alvo no Spotifast Server (`target_stores`)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200">
                {COAGRO_STORES.filter(
                  (s) => s.tipo === 'filial' && s.ativo !== false && s.identityEnabled !== false
                ).map((st) => {
                  const selected = radioSpotDraft.targetStoreIds.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => toggleStoreTarget(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        selected
                          ? 'bg-[#004d40] text-[#ffab00]'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {st.nome.replace('Coagro ', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const req = studioActions.submitMarketingRequest(
                  `Spot Rádio Coagro (${radioSpotDraft.durationSeconds}s) • Lojas: ${radioSpotDraft.targetStoreIds.join(', ')}`
                );
                flashNotice(
                  `🎙️ Roteiro ${req.protocolCode} enviado para o Curador gravar e publicar no Spotifast Server!`
                );
              }}
              className="w-full py-3 rounded-xl bg-[#001C71] hover:bg-[#001242] text-[#ffab00] text-xs font-black shadow-xs cursor-pointer"
            >
              🎙️ Enviar Roteiro para Gravação no Marketing
            </button>
          </div>
        </div>

        {/* Coluna Direita: Teleprompter & Cronômetro de Locução */}
        <div className="special-stage-card lg:col-span-7 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-black uppercase text-slate-900">
                Preview do Roteiro de Locução (Teleprompter Rádio Coagro)
              </span>
              <p className="text-[11px] text-slate-500">
                Calibrado em 2,5 palavras/segundo para encaixe limpo na grade musical Spotifast.
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                timing.isWithinLimit
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              ⏱️ ~{timing.estimatedSeconds}s ({timing.wordCount}/{timing.maxRecommendedWords} palavras)
            </span>
          </div>

          <textarea
            rows={7}
            value={radioSpotDraft.scriptText}
            onChange={(e) =>
              studioActions.updateRadioSpotDraft({ scriptText: e.target.value })
            }
            className="w-full rounded-2xl border-2 border-[#004d40]/20 bg-emerald-950/5 p-4 text-sm font-bold text-slate-900 leading-relaxed focus:outline-none focus:border-[#004d40]"
          />

          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-black text-[#ffab00] uppercase">
                Integração Spotifast Server v2.1 (Porta :8790)
              </div>
              <div className="text-[11px] text-slate-300">
                Lojas selecionadas ({radioSpotDraft.targetStoreIds.length}):{' '}
                <span className="font-mono text-white">
                  {radioSpotDraft.targetStoreIds.join(', ')}
                </span>{' '}
                • Peso: <strong>{radioSpotDraft.priority}x</strong>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-mono text-emerald-300">
              Regra 2 músicas : 1 comercial
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
