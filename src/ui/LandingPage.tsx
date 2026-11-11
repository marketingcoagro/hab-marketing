// src/ui/LandingPage.tsx
import React, { useState } from 'react';
import { GabaritoLogoSvg, GabaritoIconSvg, IconPrint, IconShare, IconShield, IconSparkles } from './icons';
import { SAAS_BRAND, buildCommercialCheckoutUrl } from '../core/types';

interface LandingPageProps {
  onGoToStudio: (exampleOfferText?: string) => void;
  onOpenPaywall?: () => void;
}

const HERO_EXAMPLES = [
  {
    id: 'agro',
    tag: 'Agro Defensivo MAPA',
    icon: '🌾',
    text: 'Fungicida Nativo 1L de R$ 249,90 por R$ 189,90 à vista MAPA: SP-00192-X',
    hint: 'Gera com ID forense e tarja estatutária de defensivo agrícola.',
  },
  {
    id: 'varejo',
    tag: 'Mercado Leve 3 Pague 2',
    icon: '🛒',
    text: 'Cerveja Heineken 350ml Leve 3 Pague 2 saindo por 4,99 cada',
    hint: 'Aplica mecânica TAKE_X_PAY_Y com destaque visual da economia.',
  },
  {
    id: 'maquina',
    tag: 'Maquinário 10x',
    icon: '🚜',
    text: 'Motosserra Stihl MS 170 de 1.490,00 por 10x de 129,90',
    hint: 'Destaque na parcela e total à vista conforme Código de Defesa do Consumidor.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToStudio, onOpenPaywall }) => {
  const [offerInput, setOfferInput] = useState(HERO_EXAMPLES[0].text);
  const [selectedExampleId, setSelectedExampleId] = useState('agro');

  // ROI Calculator State
  const [offersPerWeek, setOffersPerWeek] = useState(24);
  const [minutesPerOfferCanva, setMinutesPerOfferCanva] = useState(18);
  const [hourlyWage, setHourlyWage] = useState(32);

  // Calculations:
  // Minutes with Canva per month = offersPerWeek * 4.33 * minutesPerOfferCanva
  // Minutes with Gabarito per month = offersPerWeek * 4.33 * 0.25 (15 seconds)
  const monthlyOffers = Math.round(offersPerWeek * 4.33);
  const monthlyHoursCanva = (monthlyOffers * minutesPerOfferCanva) / 60;
  const monthlyHoursGabarito = (monthlyOffers * 0.25) / 60;
  const hoursSavedMonth = Math.max(1, Math.round(monthlyHoursCanva - monthlyHoursGabarito));
  const moneySavedMonth = Math.round(hoursSavedMonth * hourlyWage);
  const planCost = 97;
  const roiMultiplier = (moneySavedMonth / planCost).toFixed(1);

  const handleSelectExample = (ex: typeof HERO_EXAMPLES[0]) => {
    setSelectedExampleId(ex.id);
    setOfferInput(ex.text);
  };

  const handleRunTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onGoToStudio(offerInput.trim() || HERO_EXAMPLES[0].text);
  };

  return (
    <div className="landing-page min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* ---------------------------------------------------------------- Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GabaritoLogoSvg variant="on-light" className="h-9 w-auto" />
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400">
          <a href="#como-funciona" className="hover:text-amber-400 transition-colors">Como Funciona</a>
          <a href="#calculadora-roi" className="hover:text-amber-400 transition-colors">Calculadora ROI</a>
          <a href="#anti-canva" className="hover:text-amber-400 transition-colors">Anti-Canva</a>
          <a href="#planos" className="hover:text-amber-400 transition-colors">Planos</a>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onGoToStudio()}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider transition-all transform hover:scale-[1.02] shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚡</span>
            <span>Entrar no estúdio</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-black text-amber-300 tracking-wide uppercase shadow-xs">
            <span>📐</span>
            <span>Gabarito Pro • Precificação em 10 Segundos &amp; Blindagem Legal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
            Nunca Mais Perca Vendas por Cartaz Feito no Improviso.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            A primeira plataforma de precificação visual ultra-rápida criada sob medida para o <strong>varejo físico</strong> e o <strong>agronegócio</strong>. Do texto solto no WhatsApp à folha impressa com cantoneiras em 10 segundos.
          </p>

          {/* Teste Instantâneo no Hero */}
          <div className="mt-8 pt-4 max-w-2xl mx-auto text-left">
            <div className="bg-slate-900/90 border-2 border-amber-400/90 rounded-2xl p-4 sm:p-5 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <span>⚡</span> Teste Instantâneo: Cole sua oferta abaixo
                </span>
                <span className="text-[10px] font-bold text-slate-400">Zero cadastro prévio</span>
              </div>

              {/* Chips de Exemplos */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {HERO_EXAMPLES.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleSelectExample(ex)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedExampleId === ex.id
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{ex.icon}</span>
                    <span>{ex.tag}</span>
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleRunTest} className="space-y-3">
                <textarea
                  value={offerInput}
                  onChange={(e) => setOfferInput(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs sm:text-sm font-mono text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  placeholder="Cole aqui o texto da oferta (Ex: Ração Golden 15kg de 189 por 149)"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400 italic">
                    {HERO_EXAMPLES.find((e) => e.id === selectedExampleId)?.hint}
                  </p>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>⚡</span>
                    <span>Encaixar no gabarito agora</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Destaques em 3 Passos */}
      <section id="como-funciona" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-2 mb-12">
          <p className="text-xs font-black uppercase tracking-widest text-amber-400">Fluxo de balcão</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Como Funciona em 3 Passos Rápidos</h2>
          <p className="text-xs sm:text-sm text-slate-400">Elimine 14 cliques desnecessários e imprima com a fila do caixa andando.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
            <span className="text-3xl font-black text-amber-400 font-mono">01</span>
            <h3 className="text-base font-black text-white">Entrada Rápida</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cole a mensagem de texto ou áudio recebido pelo WhatsApp. Nosso parser inteligente extrai nome, preço DE, preço POR e parcelas sem digitação manual.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
            <span className="text-3xl font-black text-amber-400 font-mono">02</span>
            <h3 className="text-base font-black text-white">Blindagem Legal &amp; Cores</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O motor detecta NCMs regulados (MAPA, defensivos, PROCON), calcula equivalência por kg/litro e formata a tipografia com cantoneiras milimétricas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
            <span className="text-3xl font-black text-amber-400 font-mono">03</span>
            <h3 className="text-base font-black text-white">Saída em 10 Segundos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1 clique para imprimir em A4/A5 (modo toner econômico ou colorido) ou exportar para Stories 9:16 e Feed em 1080p sem bordas cortadas.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Calculadora de ROI */}
      <section id="calculadora-roi" className="py-16 px-4 sm:px-8 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400">Calculadora de retorno</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Quanto Dinheiro Sua Loja Paga por Cartaz Feito na Mão?</h2>
            <p className="text-xs sm:text-sm text-slate-400">Ajuste os parâmetros abaixo para calcular o tempo e o custo recuperados no mês.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
            {/* Controles da Calculadora */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Ofertas criadas por semana:</span>
                  <span className="font-mono text-amber-400 font-black">{offersPerWeek} ofertas</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={offersPerWeek}
                  onChange={(e) => setOffersPerWeek(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Minutos gastos por arte no Canva/Word:</span>
                  <span className="font-mono text-amber-400 font-black">{minutesPerOfferCanva} min</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={minutesPerOfferCanva}
                  onChange={(e) => setMinutesPerOfferCanva(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Custo da hora de trabalho da equipe:</span>
                  <span className="font-mono text-amber-400 font-black">R$ {hourlyWage},00/h</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="1"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Resultado em Destaque */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-400/30 text-center space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Economia estimada na sua loja
              </span>

              <div className="space-y-1">
                <div className="text-4xl sm:text-5xl font-black text-white font-mono">
                  {hoursSavedMonth}h <span className="text-xl text-slate-400 font-normal">livres/mês</span>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {moneySavedMonth.toLocaleString('pt-BR')},00 <span className="text-xs text-slate-400 font-normal">economizados</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs text-slate-300">
                Retorno imediato de <strong className="text-amber-400 font-mono">{roiMultiplier}x</strong> sobre a assinatura do Gabarito Pro.
              </div>

              <button
                type="button"
                onClick={() => onGoToStudio()}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                ⚡ Testar Gratuitamente no Estúdio
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Comparativo Anti-Canva */}
      <section id="anti-canva" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-2 mb-12">
          <p className="text-xs font-black uppercase tracking-widest text-amber-400">Comparativo real</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Canva e Improviso vs. Gabarito Pro</h2>
          <p className="text-xs sm:text-sm text-slate-400">Por que ferramentas genéricas de design quebram no chão de loja.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Critério de Chão de Loja</th>
                <th className="py-3 px-4 text-slate-500">No Canva / Improviso</th>
                <th className="py-3 px-4 text-amber-300 bg-slate-900/60 rounded-t-xl font-black">Com Gabarito Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-3.5 px-4 font-bold text-white">Tempo por Cartaz</td>
                <td className="py-3.5 px-4 text-red-400/90">15 a 40 minutos arrastando caixas de texto</td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold bg-slate-900/60">⚡ Menos de 10 segundos</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-white">Fiscalização PROCON &amp; MAPA</td>
                <td className="py-3.5 px-4 text-red-400/90">Risco constante de multa por esquecer validade ou texto regulatório</td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold bg-slate-900/60">🔒 100% blindado com travas automáticas</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-white">Impressão A4 / A5 / Gôndola</td>
                <td className="py-3.5 px-4 text-red-400/90">Bordas cortadas na guilhotina e desperdício de tinta</td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold bg-slate-900/60">📐 Cantoneiras gráficas e modo Toner P&amp;B</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-white">Controle de Filiais da Rede</td>
                <td className="py-3.5 px-4 text-red-400/90">Cada operador inventa cores e fontes diferentes</td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold bg-slate-900/60">🏢 Governança centralizada e travas de margem</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-white">Recorte de Fundo de Fotos</td>
                <td className="py-3.5 px-4 text-red-400/90">Exige plano pago caro ou site terceiro lento</td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold bg-slate-900/60">✨ Auto-recorte local em 0.2s a R$ 0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Tabela de Planos */}
      <section id="planos" className="py-16 px-4 sm:px-8 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400">Planos transparentes</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Comece Grátis e Assine Quando Quiser</h2>
            <p className="text-xs sm:text-sm text-slate-400">Sem contratos de fidelidade. Cancele com 1 clique a qualquer momento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PLANO BALCÃO PRO */}
            <div className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 hover:border-amber-400 transition-all space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Ideal para 1 Loja
                </span>
                <h3 className="text-xl font-black text-white">Plano Balcão Pro</h3>
                <div className="text-4xl font-black text-white font-mono">
                  R$ 97 <span className="text-xs text-slate-400 font-normal">/mês</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 pt-2">
                  <li className="flex items-center gap-2">✓ Cartazes A4, A5 e Gôndola Ilimitados</li>
                  <li className="flex items-center gap-2">✓ Stories 9:16 e Feed 4:5 em alta resolução</li>
                  <li className="flex items-center gap-2">✓ Auto-recorte inteligente de fotos</li>
                  <li className="flex items-center gap-2">✓ Modo Toner P&amp;B para economizar tinta</li>
                  <li className="flex items-center gap-2">✓ Blindagem PROCON / MAPA com ID Forense</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onOpenPaywall) onOpenPaywall();
                  else onGoToStudio();
                }}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                💳 Assinar Balcão Pro
              </button>
            </div>

            {/* PLANO GOVERNANÇA DE REDE */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-400 space-y-5 flex flex-col justify-between shadow-2xl relative">
              <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                Redes &amp; Franquias
              </span>
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Matriz + Filiais
                </span>
                <h3 className="text-xl font-black text-white">Governança de Rede</h3>
                <div className="text-4xl font-black text-amber-400 font-mono">
                  R$ 197 <span className="text-xs text-slate-400 font-normal">/mês</span>
                </div>
                <p className="text-[11px] font-bold text-amber-300/90 leading-tight bg-amber-950/60 p-2 rounded-xl border border-amber-800/60">
                  🔒 Trave a marca e o preço de custo para evitar multas e prejuízos no chão de loja.
                </p>
                <ul className="text-xs text-slate-200 space-y-2 pt-1">
                  <li className="flex items-center gap-2">✓ Múltiplas lojas e filiais conectadas</li>
                  <li className="flex items-center gap-2">✓ Integração automática com base ERP (CSV/Sheets)</li>
                  <li className="flex items-center gap-2">✓ Módulo Carrossel Guiado de Ofertas</li>
                  <li className="flex items-center gap-2">✓ Módulo Mural RH e Comunicados Internos</li>
                  <li className="flex items-center gap-2">✓ Trava anti-prejuízo e auditoria em lote</li>
                </ul>
              </div>

              <a
                href={buildCommercialCheckoutUrl(
                  'REDE',
                  'Olá, quero conhecer o Plano Governança de Rede do Gabarito Pro'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all text-center shadow-lg block cursor-pointer"
              >
                📲 Falar com Especialista no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Footer */}
      <footer className="py-8 px-4 sm:px-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
        <p className="font-bold text-slate-400">
          {SAAS_BRAND.name} — {SAAS_BRAND.tagline}
        </p>
        <p>© 2026 Gabarito Pro. Todos os direitos reservados. Conformidade técnica com PROCON, CONAR e MAPA (Lei 14.785/2023).</p>
      </footer>
    </div>
  );
};
