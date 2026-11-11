# Registro de Mudanças (Changelog) — Hub Coagro (Central de Criação & Governança de Marca)

Todas as alterações relevantes, decisões técnicas e novas funcionalidades do projeto são documentadas neste arquivo de forma cronológica e categorizada.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [3.13.0-coagro-navigation] - 2026-11-11

### Alterado
- **NAV-01 (Campanhas como eixo principal):** criado o módulo `CAMPAIGNS` e movido o conteúdo de campanhas para uma página própria reutilizando o motor do Brand Hub, sem duplicar templates ou lógica.
- **NAV-02 (Faixas e Rádio como submenus):** `Faixas e lonas` saiu do menu principal e passou para o submenu de Campanhas; `Rádio Coagro` também foi agrupado como mídia secundária.
- **NAV-03 (Kit Colaborador em destaque):** Kit Colaborador passou a ser o primeiro item operacional abaixo de Campanhas e a primeira aba do Brand Hub, herdando o espaço que era ocupado por Campanhas.
- **UX-DUP-01 (Fim da duplicação de cartão):** removida a prévia de cartão de visita do Kit Colaborador; o cartão existe somente na aba `Crachá e cartão`.
- **UX-DUP-02 (Formulário único):** removido o formulário duplicado da aba `Crachá e cartão`; a aba agora lê os dados do Kit Colaborador e oferece `Editar no Kit Colaborador`.

### Validado
- `npx tsc --noEmit`.
- `npm test`: 39/39.
- `npx vite build`.
- Teste de navegação desktop/mobile: Campanhas, Faixas, Rádio, Kit, edição compartilhada, zero overflow e zero erros de página.

## [3.12.0-agent-browser-skill] - 2026-11-11

### Adicionado
- **DOCS-SKILL-03 (Agent Browser):** instalada a habilidade `agent-browser` via `npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser` em `.agents/skills/agent-browser`.
- **DOCS-SKILL-04 (Lockfile de skills):** criado `skills-lock.json` para restaurar a habilidade com `npx skills experimental_install`.
- **CHORE-ASSETS (Referências locais):** `marca e ideias/` excluída do Git; os logos de produção permanecem embutidos em `src/ui/coagroLogos.tsx`, sem dependência do diretório local de referências.

## [3.11.0-coagro-mesa-de-prova] - 2026-11-11

### Alterado
- **DESIGN-01 (Mesa de prova Coagro):** reconstruída a camada visual global em `src/ui/styles/pulso-shell.css` com azul cobalto institucional, papel frio, malha técnica discreta, cantos de produção, tipografia Exo 2/Inter, foco dourado e sombras reservadas à prévia física.
- **DESIGN-02 (Navegação e contexto):** `src/ui/Sidebar.tsx` virou um índice de produção azul com logo branca, unidade ativa, seções em caixa de frase e sem numeração artificial; `src/ui/Topbar.tsx` recebeu seletor de perfil compacto e legível.
- **DESIGN-03 (Estúdio e prévia):** `src/App.tsx` ganhou cabeçalho editorial com descrição real do módulo, removeu o marcador de etapa isolado, encurtou os metadados e deu à prévia um palco de mesa de corte com réguas, papel e cantoneiras.
- **DESIGN-04 (Brand Hub, Curadoria, Faixas e Landing):** Brand Hub ganhou capa cobalto, abas de materiais e fichas de produção; a Fila do Curador virou bandeja contínua de KPIs; Faixas & Lonas ganharam palco de mockup; a landing executiva foi alinhada à mesma família visual clara.
- **DESIGN-05 (Tipografia de interface):** labels operacionais passaram a caixa de frase, títulos de seção usam Exo 2 e a leitura de dados usa Inter com contraste e tabular numbers.

### Validado
- `npx tsc --noEmit`: sem erros.
- `npm test`: 39/39 testes aprovados.
- `npx vite build`: concluído.
- Revisão visual em desktop e mobile, sem overflow horizontal.

## [3.10.0-coagro-frontend-design-skill] - 2026-11-11

### Adicionado
- **DOCS-SKILL-01 (Skill Frontend Design):** criado `.opencode/skills/frontend-design/SKILL.md` com o processo de direção visual, princípios de tipografia, cor, layout, movimento e escrita.
- **DOCS-SKILL-02 (Brief específico do Hub Coagro):** criado `.opencode/skills/frontend-design/references/coagro-hub.md` com tokens, metáfora da mesa de prova, assinatura visual, anti-padrões e prioridades de redesenho.

## [3.9.1-coagro-badge-official] - 2026-11-11

### Alterado
- **UI-BADGE-01 (Crachá na base oficial):** `src/ui/CoagroIdentityTemplates.tsx` reorganizou o crachá conforme a referência do Marketing: nome no topo, foto em painel branco, cargo abaixo, V institucional e base branca com a logo oficial. Foram removidos os ícones Agro/Pet/Casa/Jardim, a matrícula/telefone do rodapé e o selo `#AquiTodosVendem`.
- **UI-BADGE-02 (Assinatura da base):** a base do crachá exibe somente a logo Coagro/Coagro Pet acompanhada de **“A força do campo!”**.
- **BUG-FONT-01 (Tipografia no export):** nomes de família com espaço receberam aspas corretas em `src/ui/CoagroIdentityTemplates.tsx`, evitando fallback para fonte serifada no PNG.

### Validado
- Exportação real do crachá em PNG: `1200 × 1905 px`, sem erros de console.
- `npx tsc --noEmit`: sem erros.

## [3.9.0-coagro-profile-signature-standard] - 2026-11-11

### Alterado
- **UX-KIT-01 (Fluxo único no Kit Colaborador):** removido o gerador isolado `CoagroProfileGenerator.tsx`; Perfil 1:1 e Assinatura de E-mail agora são templates do arquivo padrão `src/ui/CoagroIdentityTemplates.tsx`, alimentados pelo mesmo formulário do Kit Colaborador em `src/ui/BrandHubView.tsx`.
- **FEAT-SIGN-01 (Assinatura de E-mail Oficial):** criado `CoagroEmailSignatureTemplate` no padrão horizontal da referência, com fundo azul e pattern `Coagro`, recortes diagonais ouro/verde, nome em Exo 2, cargo em Inter, foto circular com moldura bicolor e bloco de logo branco no canto inferior direito.
- **UI-KIT-02 (Controles centralizados):** zoom, posição horizontal/vertical, foto e toggle de nome/cargo foram movidos para o formulário padrão; alterações refletem simultaneamente no Perfil 1:1, na Assinatura e no Cartão.
- **UI-KIT-03 (Exportação e HTML):** Perfil exporta PNG em 1080×1080 e Assinatura em 2000×496 pelo motor existente `exportElementToPng`; o botão `Copiar HTML` foi atualizado para uma versão de e-mail compatível com as cores e dados institucionais.

### Corrigido
- **BUG-KIT-01 (Tipografia de apoio):** textos de cargo e contato passaram a usar `Inter` com fallback `sans-serif`, evitando renderização em fonte serifada no arquivo exportado.
- **BUG-KIT-02 (Consolidação de estado):** eliminado o formulário duplicado do gerador de perfil; os valores agora vêm de uma única fonte de estado no Kit Colaborador.

## [3.8.0-coagro-profile-1080] - 2026-11-11

### Adicionado
- **FEAT-ID-03 (Perfil Institucional Coagro 1:1 — 1080×1080px):** criado `src/ui/CoagroProfileGenerator.tsx` e integrado na aba `Kit Colaborador` de `src/ui/BrandHubView.tsx`, renderizando em HTML5 Canvas (`1080×1080`) as 6 camadas especificadas: fundo radial azul com pattern `Coagro`, geometria diagonal nos cantos (`-32°`), logo oficial `Coagro` ou `Coagro Pet`, círculo interno iluminado com foto recortada (`zoom`, `offsetX` e `offsetY`), moldura circular tripla bicolor (`#FFAB00` / `#389838` + anel branco interno) e cápsula inferior opcional com Nome (`Exo 2` Bold) e Cargo (`Inter` Medium), com download nativo via `canvas.toDataURL('image/png')`.

## [3.7.1-coagro-png-export] - 2026-11-11

### Corrigido
- **BUG-EXPORT-01 (PNG não baixava):** `src/engine/exporter.ts` agora escapa o CSS do Tailwind antes de inseri-lo no `<style>` do SVG. As at-rules `@property` usam `syntax: "<color>"`, e o `<` cru invalidava o XML do SVG.
- **BUG-EXPORT-02 (Canvas tainted no Chromium):** o SVG serializado passou a ser carregado por `data:` URI em vez de `blob:`; com `<foreignObject>`, o Chromium marcava o canvas como cross-origin e bloqueava o `toBlob`.
- **Validação real:** download confirmado para Cartaz A4, Story 1080p, Crachá e Cartão de Visita, com assinatura PNG válida e ausência de erros de página.

## [3.7.0-coagro-phase2] - 2026-11-11

### Alterado
- **UI-TEMPLATE-01 (Single-Template Standard):** `src/core/types.ts` criou o catálogo `COAGRO_POSTER_TEMPLATE_CATALOG` com apenas `PROMO_CLASSIC_V` habilitado; os demais arquétipos permanecem tipados e renderizáveis, mas marcados com `enabled: false` e `hidden: true`.
- **UI-TEMPLATE-02 (Curadoria do Módulo 1):** `src/core/store.ts` mantém o arquétipo oficial em todas as entradas (Smart Paste, ERP, mecânicas e lote), bloqueia a troca por modelos inativos e `src/App.tsx` substituiu o seletor por um badge fixo `Modelo Oficial: Promo V Clássico`.
- **UI-PREVIEW-01 (Barras Enxutas):** `src/App.tsx` removeu da barra do Módulo 1 os controles redundantes de selo/preço por medida (mantidos na Central de Configurações), restringiu o Módulo 3 a `Story` e `Feed` e removeu `1:1` também das preferências.
- **UI-LAYOUT-01 (Comunicados & Faixas):** o Smart Paste comercial deixa de ser renderizado em `HR_NOTICE` e a marca d'água de cotação em `src/ui/SpecialRequestsView.tsx` foi reduzida para `opacity-[0.045]`.
- **UI-SETTINGS-01 (Central de Identidade):** `src/ui/BrandKitModal.tsx` ocultou os presets de segmento e o seletor tipográfico, exibindo o par travado `Exo 2 + Inter`; a área de logo passou a mostrar o ativo oficial Coagro/Coagro Pet e o seletor de setores exibe apenas identidades ativas e vocabulário operacional.
- **UI-NAV-01 (Sidebar e Terminologia):** `src/ui/Sidebar.tsx` numerou os módulos operacionais de 1 a 7, usa `Nossas Unidades · Filial Ativa` e permite duas linhas para o nome da unidade; `src/ui/styles/pulso-shell.css` evita o truncamento prematuro.
- **UI-COPY-01 (Padronização de Textos):** o nome da marca em Configurações passou a `Nome do Grupo / Nossas Unidades`, o subtítulo de RH foi atualizado e a Fila do Curador agora referencia `Grupo Coagro e Coagro Pet` e as `15 Unidades Coagro`.

## [3.6.0-coagro-phase1] - 2026-11-11

### Corrigido
- **BUG-STATE-01 (Fallback de Identidade):** `src/core/store.ts` migra silenciosamente lojas/estados salvos de `RB_AGRICOLA`, unidades antigas e departamentos inativos para Coagro ou Coagro Pet, preservando os objetos legados para leitura de backups e fila.
- **BUG-RENDER-01 (Logos Nativas):** `src/engine/PosterAndSocialCanvas.tsx` injeta logos SVG oficiais no Social e no Carrossel mesmo sem `defaultLogoUrl`; o fallback social sem foto foi substituído por composição tipográfica institucional e o RH saneia parêntese órfão no nome exibido.
- **BUG-RENDER-02 (Colisão do Carrossel):** o badge de departamento da capa deixou o posicionamento absoluto e passou ao fluxo flex, evitando sobreposição com o título.
- **BUG-ORTHO-01 (Falso Positivo):** `src/core/coagroDictionary.ts` ampliou o vocabulário comum com termos portugueses como `completa`, `completo` e `selecionados`, sem alterar a inspeção de marcas/princípios ativos.
- **BUG-RADIO-01 (Unidade do Spot):** `src/core/store.ts` e `src/ui/SpecialRequestsView.tsx` sincronizam filial ativa, `targetStoreIds`, checkbox de menção e texto do teleprompter.

### Alterado
- **GOV-BRAND-01 (Tipografia Oficial):** `src/core/types.ts`, `src/core/store.ts` e `src/core/businessRules.ts` travam o motor em Exo 2 para títulos/preços e Inter para apoio/rodapé; presets white-label antigos continuam tipados, porém inativos para novas aplicações.
- **GOV-BRAND-02 (Campanha Sazonal):** `src/App.tsx` exibe a campanha ativa nos módulos de Cartazes e Anúncios, com ação direta para desativá-la e retornar ao cabeçalho institucional.
- **GOV-BRAND-03 (Identidades Oficiais):** `src/core/coagroStores.ts`, `src/ui/Sidebar.tsx` e `src/ui/BrandHubView.tsx` marcam RB Agrícola como identidade inativa e restringem os seletores ativos a Coagro/Coagro Pet sem remover registros históricos.

## [3.5.0-coagro-brand-system] - 2026-11-11

### Adicionado
- **FEAT-BRAND-01 (Sistema Visual e Governança Coagro):** Criado `docs/COAGRO_BRAND_GOVERNANCE.md` com diagnóstico, análise das referências locais, tokens oficiais, regras de composição, critérios de aceite e roadmap de templates por categoria.
- **FEAT-ID-01 (Crachá Corporativo Oficial):** Criado `CoagroBadgeTemplate` em `src/ui/CoagroIdentityTemplates.tsx`, com composição determinística inspirada na referência local (fundo azul, painel branco, faixa em V e base institucional), foto com recorte fixo, matrícula, unidade e exportação PNG no Brand Hub.
- **FEAT-ID-02 (Cartão de Visita Oficial):** Criado `CoagroBusinessCardTemplate` em `src/ui/CoagroIdentityTemplates.tsx`, com proporção 9×5 cm, área protegida de logo, recorte geométrico Coagro e slots controlados para nome, cargo, setor e contatos.
- **FEAT-UX-01 (Campos Controlados de Identificação):** Adicionada a aba `Crachá & Cartão Oficial` em `src/ui/BrandHubView.tsx`, com limites de caracteres, pré-visualização fiel e ações reais de exportação para os dois modelos homologados.

### Alterado
- **UX-VIS-01 (Brand Hub Editorial):** Adicionados tokens e componentes visuais dedicados em `src/ui/styles/pulso-shell.css` para a hierarquia do Brand Hub, tabs acessíveis e formulário de identificação sem edição livre.
- **UX-VIS-02 (Sidebar e RH):** Corrigida a logo branca sobre Sidebar clara em `src/ui/Sidebar.tsx`; `HrAndNoticeCanvas` em `src/engine/PosterAndSocialCanvas.tsx` passou a aplicar logo oficial, bordas vinculadas à paleta, `data-hr-channel` e cabeçalho consistente por canal.
- **UX-GOV-01 (Proteção contra Sobreposição):** Aplicados limites de caracteres aos campos de RH em `src/App.tsx` e aos dados de papelaria em `src/ui/BrandHubView.tsx`, mantendo o layout determinístico e os contratos semânticos existentes.

## [3.4.0-coagro-hub-visual-refinement] - 2026-11-10

### Adicionado
- **FEAT-41 (Inversão da Hierarquia de Cores no Agro & Blindagem Pet)**:
  - Definida a nova paleta Agro: Primária Titular em Azul Oficial da Logotipo Coagro (`#002B49`), Secundária em Verde-Safra Institucional (`#004d40`) e Acentos/Preço em Dourado / Amarelo Ouro (`#ffab00`) em `src/core/types.ts` e `src/core/store.ts`.
  - Blindagem mantida para a bandeira Coagro Pet (`#001C71` / `#4897D0`), isolada estritamente aos setores/lojas Pet homologados.
  - Migração profunda em `loadInitialState()` de `src/core/store.ts` para sincronizar automaticamente `dept-1` e sanear instâncias salvas no navegador.
- **FEAT-42 (Limpeza do Rodapé de PDV, Logo Vetorizada Oficial & WhatsApp da Filial)**:
  - Removido o código técnico visível `• #{metrics.forensicId}` do rodapé dos cartazes em `src/engine/PosterAndSocialCanvas.tsx` (`SingleStorePosterUnit`), preservando a rastreabilidade interna no atributo `data-forensic-id`, no log de auditoria e no modal `REQ-XXXX`.
  - Substituído o texto estático "Grupo Coagro" pela Logo Oficial Vetorizada em SVG (`LogoHorizontalAzul` / `LogoHorizontalMonoPreta` para modo Toner / `CoagroPetLogo` para Pet).
  - Inserido ícone oficial do WhatsApp ao lado do número formatado e nome da filial ativa (`brandKit.defaultPhoneWhatsapp` e `brandKit.defaultBranchName`).
  - Saneamento da chamada de balcão em `src/core/businessRules.ts` (`SmartProductEnricherService`), focando em atendimento presencial exclusivo na filial.
- **FEAT-43 (Atualização do Diretório de Unidades, Boot em Expedicionário & Flag Pet Condicional)**:
  - Adicionadas as propriedades `ativo: boolean` e `hasPetDepartment: boolean` na interface `CoagroStore` em `src/core/coagroStores.ts`.
  - Lojas desativadas (`Coagro Catedral` e `Coagro 15 de Novembro`) removidas da listagem ativa. Adicionadas unidades RB Agrícola em transição (`rb-propria` e `rb-coruripe`) com `ativo: false`.
  - `Coagro Expedicionário` definida como filial padrão de inicialização no estado global e fallback resiliente em `getCoagroStoreById`.
  - Seletor de departamentos na `Sidebar.tsx` adaptativo: filiais 100% agro ocultam a bandeira Pet para evitar ruído e emissões incorretas no balcão.
- **FEAT-44 (Brand Hub & Media Library 360° com Pacotes de Campanha)**:
  - Aba `'campaigns'` promovida a Tab 1 e padrão de abertura no `BrandHubView.tsx`.
  - Painel Criativo Dinâmico 360° estruturado por campanha ativa (**Saldão Coagro**, **Black Friday Coagro**, **Sabadão do Produtor**, **Fecha Mês Coagro** e **Natal Coagro**):
    - Visualização e download de 3 variações de Stories em 1080×1920 PNG;
    - Grade de Vídeos Promocionais filtrável por departamento (Nutrição Animal, Defensivos, Máquinas e Pet);
    - Spots de Rádio em MP3 prontos para execução no som ambiente ou download;
    - Botões de injeção em 1 clique `"⚡ Gerar Cartaz Desta Campanha"` e `"📱 Gerar Anúncio de Loja"`.
  - Destaque para Galeria de Produtos Homologados com PNG transparente e cópia rápida de dados fiscais/CNPJ.
- **FEAT-45 (Spots da Rádio Coagro com Interruptor de Menção de Loja)**:
  - Adicionado campo `mentionStoreName?: boolean` a `RadioSpotDraft` em `src/core/types.ts` e `src/core/store.ts`.
  - Atualizada a função `buildRadioSpotScript` em `src/core/businessRules.ts` para alternar entre chamada local com a unidade ativa (ex: *"Aqui na Coagro Expedicionário"*) e chamada institucional de rede (*"todas as lojas do Grupo Coagro"*).
  - Incluído toggle direto com feedback textual no formulário da Rádio Coagro em `src/ui/SpecialRequestsView.tsx`.
- **FEAT-46 (Classificação de Canal & Regra Estrita de Preto e Branco para RH/Mural)**:
  - Adicionado `channel: HrNoticeChannel` (`MURAL_A4`, `SOCIAL_INTERNAL`, `BOARD_FORMAL`) em `src/core/types.ts` e seletor com 3 cards no formulário de `HR_NOTICE` em `src/App.tsx`.
  - Opção P&B (Toner Eco) travada e restrita exclusivamente ao canal Mural Físico A4 (`MURAL_A4` + `A4_PRINT`). Formatos digitais para redes sociais e comunicados da diretoria renderizam automaticamente na paleta colorida oficial em `PosterAndSocialCanvas.tsx`.
- **FEAT-47 (Despoluição da Interface & Unificação de Perfil)**:
  - Removidos bloco duplicado de perfil e botão de ajuda no rodapé da `src/ui/Sidebar.tsx`.
  - Chip unificado de perfil no cabeçalho superior (`src/ui/Topbar.tsx`) exibindo perfil ativo, filial e tooltip com e-mail/contato institucional.
  - Travada e ocultada a opção de Geração em Lote (`batchMode`) para o perfil `OPERATOR` em `src/App.tsx`, com liberação de download direto (PDF e PNG) para ofertas regulares na Via Verde.
- **FEAT-48 (Expansão da Suíte de Testes Automatizados)**:
  - Adicionado `TEST-39` em `scripts/audit.mjs` validando inversão da paleta Agro, lojas ativas, flags de Pet, injeção das 5 campanhas, roteirizador de rádio adaptativo e fallback de IDs desativados.
  - **Suíte de Testes Automatizados**: **39/39 testes aprovados (100%)** com compilação de produção Vite limpa em 1.10s.

## [3.3.0-coagro-hub-mvp-complete] - 2026-11-10

### Adicionado
- **SPRINT 8 (Cadastro de Produtos Homologados com Foto PNG & Exportação CSV da Curadoria)**:
  - Adicionado campo `productImageUrl?: string` em `ErpCatalogRecord` e `OfferItemState` em `src/core/types.ts`.
  - Criada action `studioActions.addCustomCatalogProduct(record: ErpCatalogRecord)` em `src/core/store.ts` com sincronização e deduplicação no `customCatalogDb`.
  - Atualizado `applyCatalogRecord` para repassar automaticamente `productImageUrl` para a oferta ativa do estúdio (`currentOffer.imageUrl` e `currentOffer.productImageUrl`).
  - Atualizada a aba `'campaigns'` de `src/ui/BrandHubView.tsx` para combinar produtos manuais (`customCatalogDb`) com `DEFAULT_ERP_CATALOG_DB`, renderizando fotos dos produtos e badge visual `⭐ Curadoria`.
  - Adicionado formulário completo de cadastro de produto homologado em `BrandHubView.tsx` exclusivo para o perfil `CURATOR_ADMIN` (Kaio), com upload de foto PNG transparente via FileReader.
  - Adicionado botão `"📊 Exportar Relatório CSV"` em `src/ui/CuratorQueueView.tsx` que gera e baixa arquivo `.csv` codificado em UTF-8 (BOM `\uFEFF`) e delimitador `;` contendo todo o histórico filtrado (`Protocolo, Data, Filial, Módulo, Título, Via, Status`).
  - Adicionado `TEST-38` na suíte `scripts/audit.mjs` cobrindo o ciclo completo de homologação de SKU customizado com imagem e injeção no estúdio.
  - **Suíte de Testes Automatizados**: **38/38 testes aprovados (100%)** com compilação de produção Vite em 2.29s.

## [3.2.0-coagro-hub-cloud-spotifast] - 2026-11-10

### Adicionado
- **SPRINT 5 (Alinhamento de Constraint SQL & Auto-Sync Cloud no Boot)**:
  - Corrigido `CHECK (status in (...))` em `supabase_migration_hub_coagro.sql` para suportar formalmente `'NEEDS_REVISION'`.
  - Disparo de `studioActions.syncCloudData()` no `useEffect` de boot em `src/App.tsx`.
  - Adicionado badge de conectividade (`☁️ Cloud Ativa` / `💾 Modo Local (Offline)`) e botão `"🔄 Sincronizar"` na `CuratorQueueView.tsx`.
- **SPRINT 6 (Player de Pré-Escuta MP3 & Persistência de approvedFileUrl)**:
  - Adicionado player `<audio controls>` nos cards `RADIO_SPOT` da `CuratorQueueView.tsx` para validação imediata do áudio antes do disparo.
  - Action `updateMarketingRequestStatus` em `src/core/store.ts` e `cloudSync.ts` atualizada para persistir opcionalmente `approvedFileUrl`.
- **SPRINT 7 (Modal Global de Protocolo REQ-XXXX & Bloqueio de Formato no Balcão)**:
  - Adicionado `lastSubmittedRequest` ao estado global `StudioGlobalState` em `src/core/types.ts` e `src/core/store.ts`, com action `clearLastSubmittedRequest()`.
  - Modal Oficial de Protocolo unificado em `src/App.tsx` para todas as demandas (Cartazes, Faixas/Lonas, Spots de Rádio e Cartões de Visita).
  - Bloqueio dos seletores de tamanho (`A4 / A5 / Gôndola`) no cabeçalho do Preview em modo `OPERATOR` para proteger o padrão da loja.
- **Suíte de Testes Automatizados**:
  - Expandida para **37/37 testes passando** em `scripts/audit.mjs` (`TEST-35` a `TEST-37`).

## [3.1.0-coagro-hub-complete] - 2026-11-10

### Adicionado
- **SPRINT 1 (Persistência em Nuvem Supabase / PostgreSQL & Fallback Offline)**:
  - Criado `src/core/cloudSync.ts` com adaptador REST nativo PostgREST sem dependências pesadas, mapeamento bidirecional snake_case <-> camelCase e fallback transparente para `localStorage` quando offline.
  - Criado `supabase_migration_hub_coagro.sql` com schema completo (`stores`, `marketing_requests`, `agro_dictionary`), índices, RLS e carga inicial de 16 lojas e termos essenciais.
  - Sincronização automática em segundo plano integrada em `submitMarketingRequest`, `updateMarketingRequestStatus`, `addAgroDictionaryTerm` e `syncCloudData()`.
- **SPRINT 2 (Ponte Direta Spotifast Server :8790 para Rádio Coagro)**:
  - Criado `src/utils/spotifastBridge.ts` com upload multipart/form-data de `.mp3`, `target_stores` e `priority` (1x/2x) com modo simulação resiliente quando o servidor local :8790 estiver pausado.
  - Atualizado `src/ui/CuratorQueueView.tsx` com seletor de upload de arquivo `.mp3` e botão interativo `"📻 Publicar na Rádio Coagro (:8790)"`.
- **SPRINT 3 (Campanhas Globais da Rede & Media Library de Produtos Homologados)**:
  - Adicionada 5ª aba `'campaigns'` (`"📦 Campanhas Globais & Media Library"`) em `src/ui/BrandHubView.tsx`.
  - Exibição de pacotes oficiais (`Saldão Coagro`, `Sabadão do Produtor`, `Safra & Irrigação`) com injeção em 1 clique no estúdio (`studioActions.applyCampaignToStudio`) para Cartazes PDV e Redes Sociais.
  - Galeria de produtos homologados Coagro com filtro instantâneo e botão `"⚡ Carregar no Estúdio"` via `studioActions.applyCatalogRecord`.
- **SPRINT 4 (Despoluição Visual do Modo Balcão & Modal de Confirmação com Protocolo)**:
  - Executado `docs/DEBLOAT_AND_ROLES_PLAN.md` em `src/App.tsx`: no perfil `OPERATOR`, a interface oculta mecânicas secundárias, arredondamento psicológico e acordeon de custo, exibindo apenas o fluxo ágil em 10s (Busca SKU -> Preço -> Imprimir).
  - Adicionado Modal de Confirmação de Protocolo Oficial (`REQ-XXXX`) exibido imediatamente ao submeter peças com alerta ou que exigem curadoria na Via Amarela.
- **Suíte de Testes Automatizados**:
  - Expandida para **34/34 testes passando** em `scripts/audit.mjs` (`TEST-31` a `TEST-34`).

## [3.0.0-coagro-hub] - 2026-11-10

### Adicionado
- **FEAT-40 (Diretório Oficial das 15 Unidades Coagro, Coagro Pet e RB Agrícola)**:
  - Criado `src/core/coagroStores.ts` com todas as filiais de Alagoas, Sergipe e Bahia, CNPJs, endereços, WhatsApp e bandeira (`COAGRO_AGRO`, `COAGRO_PET`, `RB_AGRICOLA`).
  - Action `studioActions.setActiveStore(storeId)` em `src/core/store.ts` sincroniza automaticamente nome da loja, WhatsApp comercial e troca a paleta ativa entre Grupo Coagro (`#004d40` / `#ffab00`) e Coagro Pet (`#001C71` / `#4897D0`).
- **FEAT-41 (Dicionário Corporativo Agro & Vistoria Ortográfica Script-First — Seção 9)**:
  - Criado `src/core/coagroDictionary.ts` com as 4 categorias oficiais (`BRAND_PARTNER`, `COMMERCIAL_LINE`, `ACTIVE_INGREDIENT`, `CULTIVAR_REGIONAL`) e a função determinística `inspectAgroOrthography()` que remove prefixos numéricos de ERP (`0000805-`), corrige variações (`Ouro Fino` -> `Ourofino`, `Travero` -> `Tramontina`, `Mombaca` -> `Mombaça`) e sinaliza termos desconhecidos na Camada 1 (Estúdio) e Camada 2 (Fila do Curador).
- **FEAT-42 (Motor de Governança de 2 Vias: Via Verde vs. Via Amarela)**:
  - Implementado `evaluateGovernanceTrack()` em `src/core/businessRules.ts` e Client-Side Guard em `src/App.tsx`:
    - **Via Verde (`GREEN_DIRECT`)**: Cartazes de PDV e Comunicados A4 dentro das regras de margem e ortografia têm impressão/download imediato liberado para a filial.
    - **Via Amarela (`YELLOW_CURATOR`)**: Peças de Redes Sociais, Faixas/Lonas, Spots de Rádio ou ofertas com alerta de alçada/ortografia bloqueiam o download direto no perfil `STORE_MANAGER` e submetem o `payloadJson` para a Fila do Curador (`studioActions.submitMarketingRequest()`).
    - **Alçada Total (`CURATOR_ADMIN` — Kaio)**: Libera exportação direta em alta resolução e homologação em 1 clique.
- **FEAT-43 (Painel de Curadoria Centralizada, Brand Hub & Módulos de Faixas e Rádio Coagro)**:
  - Criado `src/ui/CuratorQueueView.tsx` (Fila global por loja/status, abertura da peça no estúdio em 1 clique e homologação de termos no Dicionário Coagro).
  - Criado `src/ui/BrandHubView.tsx` e `src/ui/coagroLogos.tsx` (Kit Colaborador com Assinatura de E-mail HTML/PNG, Cartão de Visita 9×5cm, Avatar WhatsApp com Casinha Coagro, Papel Timbrado A4, Vetores SVG e Diretório de Unidades).
  - Criado `src/ui/SpecialRequestsView.tsx` (Módulo 2 de Faixas/Lonas com mockup proporcional e Módulo 5 de Spots da Rádio Coagro 15s/30s integrado à regra do Spotifast Server `:8790`).
  - Expandida suíte `scripts/audit.mjs` para **30/30 testes automatizados** (`TEST-26` a `TEST-30`).

## [2.7.0] - 2026-10-22

### Adicionado
- **FEAT-34 (5 Arquétipos Oficiais de Cartazes com Geometria Estrutural Distinta)**:
  - Adicionados `PROMO_MODERN_V`, `COMBO_ADVANTAGE` e `GRID_MULTIPRODUCT_4X` ao tipo `PosterLayoutArchetype` em `src/core/types.ts`.
  - Adicionado `COMBO_ADVANTAGE` ao tipo `CommercialMechanicType` em `src/core/types.ts`.
  - Refatorado `SingleStorePosterUnit` em `src/engine/PosterAndSocialCanvas.tsx` com 5 geometrias distintas (não apenas troca de cor): header pílula flutuante arredondada em `PROMO_MODERN_V`; preço com ≥45% do peso visual vertical em `CLEAN_DIRECT_PRICE`; estética Agro Brutalist com parcelamento + à vista em `MACHINERY_INSTALLMENT`; dois polos (badge condição #10B981 + preço unitário) em `COMBO_ADVANTAGE`; escala reduzida proporcional para quadrantes em `GRID_MULTIPRODUCT_4X`.
  - Paleta oficial aplicada: Grafite Profundo (`#0F172A`), Amarelo Gabarito (`#FACC15`), Verde Esmeralda (`#10B981`) e Branco Puro (`#FFFFFF`).

- **FEAT-35 (Encarte Multiproduto em Lote — Grid 4x/6x)**:
  - Implementado suporte a grids de 6 produtos (2×3) e 4 produtos (2×2) dentro da folha A4 (`210mm × 297mm`) em `StorePosterA4Sheet` (`src/engine/PosterAndSocialCanvas.tsx`).
  - Cada quadrante totalmente contido (`overflow-hidden`, `flex flex-col justify-between`), linhas de divisão sutis (`border-dashed`), margem de segurança de impressão (safe area 8–10mm via padding nas células).
  - Atributos `data-*` (`data-sheet`, `data-slots`, `data-poster-archetype`, `data-price-integer`, `data-price-cents`, `data-effective-price`, `data-price-per-measure`, `data-guardrail-status`) preservados em cada célula do lote.

- **FEAT-36 (Carrossel Guiado de Alta Conversão — 3 Slides)**:
  - Slide 1 (Capa/Hook): tipografia display `leading-[0.95]`, `tracking-tight`, badge de categoria em Verde Esmeralda e indicador de arraste ancorado na base direita.
  - Slide 2 (Hero do Produto): composição equilibrada entre informações, selo de vantagem e Preço Atômico completo com conformidade PROCON.
  - Slide 3 (CTA Final): pílula de chamada em Verde Esmeralda (`#10B981`), benefício de compra rápida, identificação da loja e número do WhatsApp em destaque.

### Alterado
- **CALC-04 (Resolvedor de Arquétipos)**:
  - `resolveRecommendedArchetype` em `src/core/businessRules.ts` e `setMechanicType` em `src/core/store.ts` agora mapeiam `BUY_WIN_GIFT`, `TAKE_X_PAY_Y`, `SECOND_UNIT_50`, `WHOLESALE_VOLUME`, `LOYALTY_CLUB` e `COMBO_ADVANTAGE` para `COMBO_ADVANTAGE` (antes `CONDITION_ADVANTAGE`).

- **CHORE-03 (Sincronização de Testes de Auditoria)**:
  - Atualizadas asserções em `scripts/audit.mjs` para bater com o novo comportamento do resolvedor de arquétipos (`COMBO_ADVANTAGE`).

- **DOC-01 (Documentação de Pendências da Agência Autônoma)**:
  - Criado `docs/PENDENCIAS_CONFIGURACAO_AGENCIA.md` com checklist de configurações manuais pendentes no n8n, Evolution API, PostgreSQL, Cloudflared Tunnel, Ollama (RX 580) e Vercel após a execução do `setup-gabarito-agency.sh`.
- **DOC-02 (Revisão e Execução Completa do Plano do Manual de Funções e Auditoria — `EXEC-01` a `EXEC-09`)**:
  - **SEC-02 (`EXEC-01` & `EXEC-02`):** Sanitização determinística Anti-XSS em `cleanErpProductTitle` (`src/core/businessRules.ts`), escape de `documentTitle` em `printOrSaveA4Sheet` (`src/engine/exporter.ts`) e blindagem de `sendLeadCapturedToN8n` (`src/utils/leadWebhook.ts`) com `resolveN8nWebhookUrl()`, truncamento de strings e `AbortController` (timeout 5s).
  - **FEAT-37 (`EXEC-03` & `EXEC-04`):** Centralização de `commercialWhatsapp` e `buildCommercialCheckoutUrl()` em `SAAS_BRAND` (`src/core/types.ts`), substituindo números hardcoded em `src/ui/PaywallModal.tsx` e `src/ui/LandingPage.tsx` e eliminando o envio de leads fictícios (`usuario.google@varejo.com`) no clique rápido.
  - **UX-05 (`EXEC-05`, `EXEC-06`, `EXEC-07` & `EXEC-08`):** Polimento óptico de Diretor de Arte em `SingleStorePosterUnit` (`tabular-nums`, escala `R$` ~28%, rodapé técnico discreto e integração das skins `RETAIL_POP`, `AGRO_BRUTALIST` e `MINIMAL_BOUTIQUE`), seletor rápido de arquétipos no Estúdio (`src/App.tsx`) e Configurações (`src/ui/SettingsCenter.tsx`), ocultação de `HR_NOTICE` no Modo Balcão (`src/ui/Sidebar.tsx`), botão de extração de cores da logo (`extractDominantColorsFromImage` em `src/ui/BrandKitModal.tsx`), toggle `enableSubDepartments` e gravação de `generationAuditHistory` em `src/core/store.ts`.
  - **QA-03 (`EXEC-09`):** Suíte `scripts/audit.mjs` expandida para 25 testes automatizados (`TEST-23` a `TEST-25`).

## [2.6.0] - 2026-10-22

### Adicionado
- **FEAT-32 (Planos Comerciais Oficiais em SAAS_BRAND)**:
  - Adicionado objeto `plans` (`balcaoProPrice: 97`, `governancaPrice: 197`) à constante `SAAS_BRAND` em `src/core/types.ts`.
- **FEAT-33 (Workflow n8n da Máquina de Vendas 24/7 + Conector Webhook Lead)**:
  - Criado `scripts/n8n-workflow-gabarito.json` com os 3 fluxos de automação (Cavalo de Troia, Captura nos 95% via webhook `gabarito:lead_captured` e Entrega de Chave pós-pagamento) prontos para importar no `localhost:5678`.
  - Criado `src/utils/leadWebhook.ts` com a função `sendLeadCapturedToN8n` (5 linhas) que dispara um POST para o webhook do n8n sempre que um lead é capturado no estúdio.
  - Integrado `sendLeadCapturedToN8n` na action `setLeadProfile` de `src/core/store.ts`, conectando o evento `gabarito:lead_captured` da Vercel ao n8n local via Cloudflared Tunnel.

### Alterado
- **CHORE-02 (Sincronização de Versão)**:
  - Atualizada `version` em `package.json` de `2.1.0` para `2.6.0` para bater com o CHANGELOG.md.
- **QA-02 (Expansão da Suíte de Auditoria para 22 Testes Automatizados)**:
  - Adicionados testes TEST-19 a TEST-22 em `scripts/audit.mjs`, validando tipagem de marca, calibração determinística de 5 dígitos (`15cqw` em gôndola e `17cqw` em A5 meia-folha), ausência de `printOrSaveA4Sheet` no `onerror` do exportador PNG e suporte a todos os presets de estilo visual no `TenantBrandKit`.

### Corrigido
- **BUG-EXP-01 (Exportação PNG Disparando Impressão & Bloqueio CORS de Fontes)**:
  - Removida chamada a `printOrSaveA4Sheet` dentro de `img.onerror` em `exportElementToPng` (`src/engine/exporter.ts`), eliminando o bug em que o botão de baixar PNG abria a janela de impressão.
  - Removido `@import` externo de Google Fonts injetado no SVG serializado, prevenindo problemas de canvas tainted e erro de renderização no navegador.
- **BUG-VIS-05 (Isolamento Cromático da Casca SaaS vs. Canvas do Cartaz)**:
  - Removida sobrescrita de `--brand` no `.app-shell` em `src/App.tsx`, preservando a identidade oficial da logo Gabarito Pro (`#0F172A` grafite e `#FACC15` amarelo), limitando a cor do departamento ativo ao interior da peça publicitária e a um indicador sutil na Sidebar (`src/ui/Sidebar.tsx`).
- **BUG-VIS-06 (Harmonização de Botões Operacionais com a Paleta Oficial)**:
  - Botões operacionais (modo individual vs lote, mecânicas promocionais, abas de carrossel e presets de RH) migrados de `bg-emerald-900` para `bg-slate-900` com texto branco, reservando o verde esmeralda exclusivamente para badges de conformidade (`VALID`, `Score 100/100`, status de salvamento e guardrails ativos).
- **BUG-VIS-07 (Traço Diagonal do Preço DE e Badge de Slides no Carrossel)**:
  - Calibrada a linha diagonal de corte do preço "DE" para `h-[0.35cqw]` em `src/engine/PosterAndSocialCanvas.tsx`, garantindo que o valor antigo permaneça legível para compliance PROCON sem cobrir os números.
  - Badge de slide no `GuidedCarouselCanvas` padronizada com fundo escuro sólido (`bg-slate-950 text-white`) e alto contraste.

### Alterado
- **UX-03 (Despoluição Vertical "Zero Scroll" e Tabela de Lote)**:
  - Removido o bloco duplicado `page-intro` no topo do Studio em `src/App.tsx`, liberando ~150px verticais para foco imediato no formulário e na prévia.
  - Eliminadas badges duplicadas de "Salvo automaticamente" entre a barra de status e o cabeçalho do studio.
  - Tabela do modo lote formatada com `font-mono tabular-nums` para alinhamento profissional dos valores de importação ERP.
- **UX-04 (Topbar Limpa, Link no Rodapé da Sidebar & Ajustes de Polimento)**:
  - Removido botão `🌐 Apresentação / Site` da Topbar no Estúdio em `src/ui/Topbar.tsx`, movido link para o rodapé da Sidebar em `src/ui/Sidebar.tsx`.
  - Botão Google 1-Clique em `src/ui/PaywallModal.tsx` alinhado simetricamente com `w-5 h-5 shrink-0` e `gap-3 px-5 py-3`.
  - Hero section de `src/ui/LandingPage.tsx` padronizada com `space-y-6`.

## [2.5.0] - 2026-10-21

### Adicionado
- **FEAT-28 (Modo Balcão Operacional vs. Modo Gerente de Governança)**:
  - Adicionado seletor segmentado `[ 🛒 Modo Balcão ]` vs `[ ⚙️ Modo Gerente ]` no topo da barra de navegação (`src/ui/Topbar.tsx`), com persistência instantânea em `useUiPrefs`.
  - Modo Balcão despolui a interface, reduzindo o fluxo a 3 passos essenciais (Entrada Rápida via Smart Paste, Produto & Preço, e Saída Imediata) e ocultando controles manuais de arredondamento, custo e vigência.
- **FEAT-29 (Skins Geométricas Arquitetônicas nos Cartazes)**:
  - Adicionado campo opcional `visualStylePreset?: 'RETAIL_POP' | 'AGRO_BRUTALIST' | 'MINIMAL_BOUTIQUE'` em `TenantBrandKit` (`src/core/types.ts`) e seletor visual no modal de marca (`src/ui/BrandKitModal.tsx`).
  - Renderização geométrica customizada em `SingleStorePosterUnit` e `SocialMediaCardCanvas` (`src/engine/PosterAndSocialCanvas.tsx`) para cada acabamento.
- **FEAT-30 (Portão de Captura de Lead aos 95% + Webhook Ready)**:
  - Implementado tipo `LeadProfile` em `src/core/types.ts` e action `setLeadProfile` em `src/core/store.ts` com persistência em `gabarito_lead_profile_v1` e disparo de `CustomEvent('gabarito:lead_captured')`.
  - No 1º download ou impressão de usuários no plano `FREE`, modal de liberação em 300 DPI (`src/ui/PaywallModal.tsx`) com 1 clique via Google ou WhatsApp comercial, seguido da execução imediata do download/impressão.
  - Paywall com 2 caminhos de autovenda sem atrito: Plano Balcão Pro (R$ 97/mês) e Plano Governança de Rede (R$ 197/mês com link dinâmico para WhatsApp).
- **FEAT-31 (Landing Page de Autovenda Integrada)**:
  - Criado `src/ui/LandingPage.tsx` com Hero e teste instantâneo em 1 clique ("ENCAIXAR NO GABARITO AGORA"), 3 chips de teste (Agro, Mercado, Máquinas), Calculadora interativa de ROI, Comparativo Anti-Canva e Tabela de Planos Self-Service.
  - Adicionado botão `[ 🌐 Apresentação / Site ]` em `src/ui/Topbar.tsx` com sincronização de rota e suporte a hash.

## [2.4.0] - 2026-10-21

### Adicionado
- **FEAT-27 (Rebranding Oficial "Gabarito Pro" — Identidade, Logo SVG, Favicon e Paleta de Precisão)**:
  - Adicionada constante central `SAAS_BRAND` em `src/core/types.ts` (`name: 'Gabarito Pro'`, `shortName: 'Gabarito'`, `tagline: 'Precificação em 10s & Governança Visual'`, `domain: 'gabarito.pro'`).
  - Adicionados componentes `GabaritoLogoSvg` e `GabaritoIconSvg` em `src/ui/icons.tsx` com renderização vetorial do esquadro industrial, marcas de corte (#FACC15), G geométrico e selo PRO.
  - Atualizado favicon SVG e título no `index.html` para `Gabarito Pro — Precificação em 10s & Governança Visual`.
  - Integrado `GabaritoLogoSvg` na Sidebar (`src/ui/Sidebar.tsx`), substituindo o wordmark antigo e atualizando avatares/iniciais fallback para `GP`.
  - Atualizada paleta de tokens `:root` em `src/ui/styles/pulso-shell.css` para a estética técnica Gabarito (Grafite `#0f172a`, Amarelo Esquadro `#facc15` e Verde Conformidade `#10b981`).
  - Atualizados links e títulos do Paywall (`src/ui/PaywallModal.tsx`), exportador CSV e ativação de licenças (`GABARITO-`) em `src/core/store.ts`.
  - Atualizado `name` em `package.json` para `gabarito-pro`.

## [2.3.0] - 2026-10-20

### Adicionado
- **FEAT-23 (App Shell Editorial "Pulso" — Sidebar 5 Categorias, Topbar & Drawer Mobile)**:
  - Criada folha de estilos escopada `src/ui/styles/pulso-shell.css` com tokens em `:root` (`--canvas: #f4f5f0`, `--paper: #ffffff`, `--line: #e8ebe3`, `--ink: #20291f`, `--brand`, `--highlight`) compatíveis com a serialização de `exportElementToPng` e `printOrSaveA4Sheet`.
  - Criados componentes `src/ui/Sidebar.tsx`, `src/ui/Topbar.tsx` e `src/ui/icons.tsx`, estruturando a navegação principal nas 5 categorias exigidas (`Redes sociais`, `Cartazes de loja`, `Carrosséis`, `RH & comunicados` e `Configurações gerais`), seletor de departamentos no card de workspace, card de cota freemium preservando `data-freemium-tier`, `data-freemium-used` e `data-freemium-limit`, e gaveta responsiva (`drawer`) para telas `<= 1023px`.
  - Adicionado modal de ajuda rápida e atalhos de teclado (`Alt+H`) em `src/App.tsx`.
- **FEAT-24 (Central Única de Configurações em 6 Abas & Roteamento Hash `#/configuracoes/<aba>`)**:
  - Criados `src/ui/SettingsCenter.tsx` e `src/ui/settingsTabs.ts` consolidando todas as parametrizações da loja em 6 seções (`identidade`, `regras`, `cartazes`, `social`, `erp`, `acesso`) com sincronização de URL hash (`hashchange`).
  - Adicionada prop `variant?: 'modal' | 'embedded'` em `src/ui/BrandKitModal.tsx` e `src/ui/ErpIntegrationModal.tsx` para renderização embutida sem overlay fixo.
  - Adicionada action `togglePosterPricePerMeasure` em `src/core/store.ts`, expondo na UI o controle `posterConfig.showPricePerKgOrLiter` (equivalência de preço por quilo/litro).
- **FEAT-25 (Stage de Prévia com Cantoneiras de Guilhotina & Modo Stack para Lotes)**:
  - Criado `src/ui/PreviewStage.tsx` com fundo técnico pontilhado (`.stage-dots`), moldura `.creative-frame` com 4 cantoneiras gráficas (`.frame-corner`) para peças individuais e modo `.preview-stage--stack` para rolagem fluida de múltiplas folhas A4 no Modo Lote.
- **FEAT-26 (Preferências Locais de Interface e Visibilidade por Módulo — `useUiPrefs.ts`)**:
  - Criado store reativo `src/ui/useUiPrefs.ts` (`useSyncExternalStore`) persistido na chave isolada `alfa_pulso_ui_prefs_v1` (desacoplada do backup `.json` do tenant), permitindo alternar e persistir `workMode` (`OPERATOR` | `MANAGER`) e ocultar/exibir campos opcionais (`posterSubtitle`, `posterPriceFrom`, `posterBadge`, `posterPricePerMeasure`, `socialImage`, `socialBullets`, `socialCta`, `hrReference`, `hrCompensation`, `hrRequirements`, `hrContact`).
- **DOCS-04 (Documentação Técnica do Facelift Pulso)**:
  - Criado `docs/UI_FACELIFT_PULSO.md` e atualizado `docs/README.md` detalhando a nova arquitetura visual, inventário de componentes e garantias de contratos DOM.

### Alterado
- **UX-01 (Despoluição da Coluna de Edição e Barra Unificada de Prévia em `src/App.tsx`)**:
  - Aplicado cabeçalho numerado `.editor-header` (`01`), barra unificada `.preview-tools` (substituindo controles duplicados de formato/tema no topo e no acordeon), card `.compliance-inline` com status do rodapé legal e atalho direto para regras, e injeção dinâmica de `--brand` / `--brand-ink` (WCAG 2.1 via `resolveAccessibleTextColor`) a partir do departamento ativo.
  - Removidos chips repetitivos de demonstração de SKU, botão manual redundante `Limpar Siglas` (mantido automático no `onBlur` e via `Alt+L`) e acordeon com duplicatas de controles sociais.
- **UX-02 (Escala Tipográfica Operacional, Microcopy Comercial, Busca Silenciosa de SKU, Accordion de CTA e Cards Sociais Retos)**:
  - Elevada a escala tipográfica base em `src/ui/styles/pulso-shell.css` (base `15px`, inputs `14px` / `40px`, labels `12px`, navegação `13.5px`) e reduzidos pesos excessivos em elementos secundários para leitura confortável em monitores de balcão.
  - Simplificados os títulos e subtítulos de `MODULE_META` em `src/App.tsx` e `src/ui/Sidebar.tsx`, removendo slogans prolixos e termos como *"Ateliê de artes"* e *"Zero digitação"* em favor de instruções comerciais diretas (*"Cole o texto da oferta recebido via WhatsApp"*), alinhando o ícone `?` (`HelpHint`) estritamente em linha com as labels e concentrando os atalhos de teclado exclusivamente no modal de Ajuda (`Alt+H`).
  - Removidos os botões de infraestrutura (`🔌 Base ERP` e `🔍 Buscar`) do campo de SKU em `src/App.tsx`: códigos que coincidem com a base ERP preenchem os dados automaticamente em segundo plano; códigos avulsos são gravados diretamente na arte sem travar o fluxo.
  - Agrupadas as sugestões secundárias de CTA em um componente recolhível `<details className="cta-accordion">` (**"Mais opções de CTA"**) abaixo do campo principal de CTA no módulo de Redes Sociais.
  - Removido o `border-radius` externo dos cards e cartazes em `SingleStorePosterUnit` e `SocialMediaCardCanvas` (`src/engine/PosterAndSocialCanvas.tsx`) e `.creative-frame` (`src/ui/styles/pulso-shell.css`), mantendo cantos retos compatíveis com as folhas de impressão (A4, A5, Gôndola) e proporções reais de postagem (9:16, 4:5 e 1:1), e eliminados cabeçalhos/rodapés escuros (`bg-slate-900`) herdados quando `BrandKitModal` e `ErpIntegrationModal` operam em modo `embedded`.

### Corrigido
- **BUG-TEST-01 (Fuso Horário Local no Teste de Vigência Retroativa em `scripts/audit.mjs`)**:
  - Substituído `yesterday.toISOString().split('T')[0]` (UTC) pela formatação local `YYYY-MM-DD` no teste P0-04 em `scripts/audit.mjs`, eliminando falha por deslocamento de fuso (`UTC-3`) à noite.
- **CHORE-01 (Higiene de Repositório e Favicon)**:
  - Adicionado favicon SVG inline em `index.html` (eliminando erro 404 no navegador) e ignorados `interface legal/node_modules`, `interface legal/data` e `interface legal/.next` no `.gitignore`.

## [2.2.0] - 2026-10-20

### Corrigido
- **BUG-VIS-01 (Escala Dinâmica para Preços de 5+ Dígitos em Cartazes de Gôndola e A5)**:
  - Adicionado degrau `intDigits >= 5` em `resolveRenderSpec` (`src/core/resolve.ts`) calibrando a fonte do inteiro para `15cqw` em Gôndola 2×2 e `17cqw` em A5 Meia-Folha, eliminando quebras de linha indesejadas em valores como `R$ 18.990,00`.
- **BUG-VIS-02 (Compressão Vertical e Proteção do Rodapé MAPA/CRMV em A5 Compacto)**:
  - Ajustado padding vertical do bloco central de preço em `SingleStorePosterUnit` (`src/engine/PosterAndSocialCanvas.tsx`) de `py-[2cqw]` para `py-[1cqw]` quando ativo `isHighRiskRegulated` em conjunto com layout compacto (`isA5Half` ou `isGondola`), blindando o rodapé com ID Forense contra sobreposição.
- **BUG-VIS-03 (Fallback Tipográfico Monumental no Card Social sem Imagem)**:
  - Implementado em `SocialMediaCardCanvas` (`src/engine/PosterAndSocialCanvas.tsx`) um badge tipográfico monumental de alto contraste quando `!offer.imageUrl`, utilizando cor de destaque, ícone/nome do departamento ativo e selo da mecânica promocional com drop-shadow, eliminando espaços vazios no post de rede social.
- **BUG-VIS-04 (Injeção de Fontes Tipográficas no Exportador PNG)**:
  - Em `exportElementToPng` (`src/engine/exporter.ts`), incluída a injeção dinâmica de declarações `@import` do Google Fonts para as fontes ativas no `brandKit` (`fontHeading`, `fontBody`) dentro do `<style>` do SVG `<foreignObject>`, prevenindo fallback para Arial no render em dispositivos móveis e sandboxes.

### Adicionado
- **FEAT-20 (Preset de Geometria de Templates — Skins Estruturais)**:
  - Adicionado tipo `VisualStylePreset` (`RETAIL_POP`, `AGRO_BRUTALIST`, `MINIMAL_BOUTIQUE`, `SUPERMARKET_IMPACT`, `ECO_TONER`) em `src/core/types.ts` e no `brandKit` (`src/core/store.ts`).
  - Aplicadas variações geométricas reais nos componentes `SingleStorePosterUnit` e `SocialMediaCardCanvas` (bordas arredondadas e cabeçalho cápsula no `RETAIL_POP`, cortes chanfrados e bordas duplas industriais no `AGRO_BRUTALIST`, moldura fina no `MINIMAL_BOUTIQUE`, etc.).
- **FEAT-21 (Despoluição Radical da Interface — Fluxo em 3 Passos & Modos Balcão / Gerente)**:
  - Adicionado seletor de perfil no cabeçalho do `src/App.tsx`: `[ 🛒 Modo Balcão (Rápido) ]` vs `[ ⚙️ Governança & Ajustes ]`.
  - Modo Balcão estruturado em 3 passos diretos: Passo 1 (Entrada Inteligente com link "✨ Testar com exemplo"), Passo 2 (Conferência Rápida com limpeza automática de siglas no `onBlur` do título, Preço DE/POR e seletor enxuto de 4 mecânicas), e Passo 3 (Botão grande fixo de ação direta para impressão A4 imediata ou download PNG 1080p).
  - Ocultados no Modo Balcão: seletores manuais de arredondamento, vigência, título de etiqueta e arquétipos (resolvidos deterministicamente pelo `resolveRecommendedArchetype`).
  - Desenvolvida barra flutuante minimalista (Floating Dock) no topo do preview para alternância ágil de formato (`A4`, `A5`, `Gôndola` / `Story`, `Feed`, `1:1`) e tema (`Colorido` vs `Toner P&B`) sem poluição visual.
- **FEAT-22 (Portão de Captura de Lead nos 95% & Modal de Planos Dual Self-Service)**:
  - Refatorado `src/ui/PaywallModal.tsx` com suporte a dois modos: `LEAD_CAPTURE` (identificação rápida de Nome da Loja + WhatsApp/E-mail ou Google para liberar download gratuito antes do consumo da cota) e `UPGRADE_PAYWALL` (apresentação dos planos Starter R$ 97/mês self-service e Rede/Governança R$ 197/mês com botão de atendimento no WhatsApp).
  - Integrada a checagem no fluxo de exportação protegida em `src/App.tsx` disparando a captura sem atrito nos 95% do fluxo do operador.

## [2.1.0] - 2026-10-19

### Corrigido
- **BUG-P0-01 (Desacoplamento Multi-Produto nos Slides do Carrossel Guiado)**:
  - Adicionados campos de produto (`skuCode`, `cleanedTitle`, `priceFrom`, `priceTo`, `unit`, `mechanicType`, `installmentCount`, `giftOrConditionText`, `regulatoryCategory`) à interface `CarouselSlideItem` em `src/core/types.ts`.
  - Refatorado `GuidedCarouselCanvas` (`src/engine/PosterAndSocialCanvas.tsx`) para sintetizar `slideOffer` com os dados do próprio slide, permitindo que cada slide de oferta exiba seu próprio preço unitário, centavos atômicos (`data-price-integer`, `data-price-cents`), ancoragem De/Por, parcelamento e unidade de medida sem depender exclusivamente do estado global de `currentOffer`.
  - Atualizadas as actions `addCarouselSlide` e `generateCarouselFromCatalog` em `src/core/store.ts` para popular os dados de produto em cada slide gerado a partir do catálogo ERP.
- **BUG-P0-02 (Conformidade Regulatória MAPA/CRMV em Mecânica Turbo Expiry)**:
  - Corrigido conflito em `computeOfferMetrics` e `getLegalFooterMetadata` (`src/core/businessRules.ts`): quando um defensivo agrícola, vacina veterinária ou adubo está com a mecânica `TURBO_EXPIRY` ativa, o sistema agora preserva a advertência legal obrigatória (Lei 14.785/2023, receituário agronômico/veterinário) e anexa o alerta PROCON de lote próximo ao vencimento, eliminando o risco fiscal de supressão de aviso obrigatório.
- **BUG-P0-03 (Colisão no Mapa de Abreviações ERP — `SEM` vs `SEMENT`)**:
  - Removida a chave `'SEM': 'Semente'` de `ERP_ABBREVIATION_MAP` em `src/core/businessRules.ts`, que convertia expressões frequentes do varejo ("RAÇÃO SEM CORANTE", "LEITE SEM LACTOSE", "SOPA SEM SAL") para "Semente" e acionava indevidamente o alerta regulatório de insumos agrícolas do MAPA. Substituída pela chave unívoca `'SEMENT': 'Semente'`.
- **BUG-P0-04 (Bloqueio de Exportação para Vigência Vencida no Calendário)**:
  - Ajustada a função `formatOfferValidityText` em `src/core/businessRules.ts` para preservar a diferença de dias assinada (`diffDays <= 0`).
  - Implementada a regra de bloqueio `EXPIRES_BEFORE_PROMO` em `evaluateOfferGuardrails`: quando o operador seleciona `validityPreset === 'CUSTOM_DATE'` com uma data retroativa, o sistema bloqueia a exportação (`canExport = false`, `severity: 'block'`), impedindo propaganda enganosa perante o CDC/PROCON.
- **BUG-P0-05 (Corte de Página 2+ na Impressão em Lote A4)**:
  - Ajustado o CSS `@media print` em `printOrSaveA4Sheet` (`src/engine/exporter.ts`), removendo `height: 297mm; overflow: hidden;` que truncava folhas a partir da 2ª página em lotes de 10+ produtos.
  - Otimizada a renderização de `StorePosterA4Sheet` (`src/engine/PosterAndSocialCanvas.tsx`) com memoização de render specs (`resolvedBatchEntries`).

### Adicionado
- **FEAT-16 (Motor Centralizado de Resolução de Arquétipos Visuais — `resolveRecommendedArchetype`)**:
  - Criada função pura `resolveRecommendedArchetype` em `src/core/businessRules.ts`, unificando a inferência de layout para `INSTALLMENT_FINANCING` (`MACHINERY_INSTALLMENT`), `BUY_WIN_GIFT` / combos (`CONDITION_ADVANTAGE`), `SIMPLE_DE_POR` com ancoragem (`PROMO_CLASSIC_V`) e ofertas de preço limpo (`CLEAN_DIRECT_PRICE`).
- **FEAT-17 (Classificação Fiscal por NCM & Expansão de Princípios Ativos)**:
  - Adicionado suporte a NCM em `detectRegulatoryCategoryByText` (`src/core/businessRules.ts`) para defensivos (`3808*`), fertilizantes/sementes (`3101*..3105*`), vacinas e biológicos veterinários (`3002.30*`) e bebidas alcoólicas (`2203*..2208*`).
  - Adicionado campo opcional `ncmCode` às interfaces `ErpCatalogRecord` e `BatchParsedRow` (`src/core/types.ts`) e captura automática em `normalizeUniversalErpDataset`.
  - Expandido o reconhecimento químico para princípios ativos comuns: cipermetrina, imidacloprido, ivermectina, doramectina, enrofloxacino, oxitetraciclina, etc.
- **FEAT-18 (Formatação Determinística de Moeda — `formatBRL`)**:
  - Criada e exportada a função `formatBRL(value: number): string` em `src/core/businessRules.ts` garantindo separação de milhar com ponto e decimais com vírgula (`1899` -> `"1.899,00"`), utilizada em todos os cálculos monetários e módulos de exportação.
- **FEAT-19 (Carregamento Completo de Fontes dos Presets White-Label)**:
  - Incluídos no `index.html` os links pré-conectados do Google Fonts para todas as famílias tipográficas dos 4 presets homologados: Montserrat, Inter, Oswald, Roboto, Poppins, Open Sans, Archivo Black e Public Sans.
- **SEC-01 (Blindagem de Segurança e Portabilidade de Backups JSON)**:
  - `exportFullTenantBackup` em `src/core/store.ts` agora higieniza o estado e remove `geminiApiKey` para evitar vazamento acidental de chaves de API em backups compartilhados.
  - `importFullTenantBackup` agora valida os dados recebidos e preserva `planTier` e `freemiumQuota` locais, impedindo ataques de escalada de privilégios de plano via manipulação do arquivo `.json`.
- **PERF-01 (Eliminação de Latência de Digitação com Debounce de Persistência)**:
  - Implementado debounce de 120ms na chamada de `window.localStorage.setItem` em `src/core/store.ts` com garantia de descarga síncrona no evento `beforeunload`, eliminando travamentos de UI durante a digitação de ofertas no balcão.
- **PERF-02 (Downscaling Preventivo em Imagens de Alta Resolução)**:
  - Adicionado downscaling proporcional para fotos de smartphone com resolução superior a 1600px em `tightCropAlphaDataUrl` (`src/engine/exporter.ts`) antes do cálculo de Flood-Fill e corte alfa, gerando economia de ~80% de memória RAM e latência de processamento.
- **TEST-01 (Suíte Completa de Testes de Auditoria Automatizada — `scripts/audit.mjs`)**:
  - Implementada suíte de testes de regressão executável via `npm test` (`node scripts/audit.mjs`), cobrindo 18 casos de teste essenciais: sanitização de abreviações ERP, detecção fiscal por NCM e princípios ativos, conformidade MAPA em Turbo Expiry, bloqueio de vigência retroativa, formatação BRL, segurança de backups, mecânicas do WhatsApp Smart Paste, resolução de arquétipos, carrossel multi-produto e contratos DOM do `resolveRenderSpec`.
  - Adicionados scripts `"test": "node scripts/audit.mjs"` e `"typecheck": "tsc --noEmit"` no `package.json`.
- **DOCS-02 (Auditoria Independente de Frontend, UX/UI e Arquitetura Visual — `docs/FRONTEND_UX_AUDIT.md`)**:
  - Documentado diagnóstico técnico e nota de UX (0 a 10) de todos os componentes de visualização (`SingleStorePosterUnit`, `StorePosterA4Sheet`, `SocialMediaCardCanvas`, `GuidedCarouselCanvas`, `HrAndNoticeCanvas`) e utilitários de exportação.
  - Mapeadas 4 falhas visuais do mundo real (preços de 5 dígitos em Gôndola 2x2, sobreposição de rodapé MAPA em A5, ausência de imagem no card social e sandbox de fontes no PNG).
  - Elaborada matriz de redução de atrito (simplificação do fluxo de 14 para 3 passos) e plano de ação priorizado (P0 a P4).
- **DOCS-03 (Consolidação Documental em `docs/` e Plano de Despoluição Visual)**:
  - Adicionado `docs/BACKEND_CORE_AUDIT.md` consolidando a auditoria profunda de regras de negócio, NCMs e segurança de backups.
  - Adicionado `docs/DEBLOAT_AND_ROLES_PLAN.md` com o Plano Mestre de Despoluição Visual ("Fim do Painel de Avião"), matriz de permissões de 3 perfis (Operador, Gerente e Administrador) e desenho da Central Única de Configurações.
  - Criado `docs/README.md` como índice geral da documentação e `README.md` na raiz do projeto orientando a navegação.

---

## [2.0.0] - 2026-10-18

### Adicionado
- **FEAT-13 (Módulo 3: Construtor de Carrossel Guiado 4:5 — `GuidedCarouselCanvas` & Geração em 1 Clique da Base ERP)**:
  - Criado o componente `GuidedCarouselCanvas` em `src/engine/PosterAndSocialCanvas.tsx` (100% White-Label e escalado em `cqw`), suportando slides do tipo `HOOK_COVER` (Capa de Atenção), `PRODUCT_OR_CONTENT` (Oferta/Produto com condição em destaque e bloco de preço atômico) e `FINAL_CTA` (Chamada final com WhatsApp e filial da rede), mantendo obrigatoriamente `CÓD: {skuCode}`, nome/logo da marca, barra de progresso visual e ID Forense (`#AP-XXXX-XXX`).
  - Adicionadas as actions `setActiveCarouselSlide`, `updateCarouselSlide`, `addCarouselSlide`, `removeCarouselSlide` e `generateCarouselFromCatalog` em `src/core/store.ts`, permitindo gerar um carrossel completo automaticamente a partir dos produtos importados na Base ERP com 1 clique.
  - Adicionada a aba `🎠 Carrossel Guiado` (atalho `Alt+3`) em `src/App.tsx` com navegação entre slides e exportação PNG 1080p / compartilhamento WhatsApp.
- **FEAT-14 (Módulo 4: RH, Vagas & Comunicados Internos A4 e Social — `HrAndNoticeCanvas`)**:
  - Criados os tipos `HrNoticeArchetype` (`'JOB_VACANCY' | 'INTERNAL_NOTICE' | 'SAFETY_COMPLIANCE'`) e `HrNoticeState` em `src/core/types.ts`, a função de rastreio determinístico `generateHrForensicId` em `src/core/businessRules.ts` e o componente `HrAndNoticeCanvas` em `src/engine/PosterAndSocialCanvas.tsx`.
  - Implementada a aba `📢 RH & Comunicados` (atalho `Alt+4`) em `src/App.tsx` e as actions `updateHrNotice` e `applyHrPreset` em `src/core/store.ts` com 3 modelos prontos 100% White-Label (`💼 Vaga / Estamos Contratando`, `📋 Comunicado Oficial / Horário` e `🦺 Segurança do Trabalho / EPI NR-06`), suportando saída tanto em Cartaz Mural A4 (`A4_PRINT`) quanto Card Feed 4:5 (`SOCIAL_FEED`) e preservando os atributos `data-hr-archetype`, `data-sku-code` e `data-brand-name`.
- **FEAT-15 (Governança Matriz, Chave Gemini Vision Opcional, Portabilidade `.JSON` e Contrato API Headless `POST /api/v1/render`)**:
  - Adicionado editor ao vivo de **Campanhas Sazonais da Matriz** (`updateSeasonalCampaign`), campo opcional de **Chave Gemini Flash Vision (`geminiApiKey`)** conectado ao `SmartProductEnricherService` (`setGeminiApiKey`), e botões de **Exportação/Restauração de Backup Completo da Loja (`.json`)** (`exportFullTenantBackup` / `importFullTenantBackup` em `schemaVersion: 4`) em `src/ui/BrandKitModal.tsx`.
  - Criada função pura `buildHeadlessRenderPayload` em `src/core/businessRules.ts` e painel **Contrato API Headless Enterprise (`POST /api/v1/render`)** em `src/ui/ErpIntegrationModal.tsx`, expondo o payload JSON canônico com elementos core, tokens White-Label e ID Forense para automação direta via Webhooks com sistemas ERP.

---

## [1.2.0] - 2026-10-18

### Adicionado
- **FEAT-10 (Governança White-Label Total: Pares Tipográficos Homologados, Presets de Segmento & Zero Hardcode)**:
  - Criados `WHITE_LABEL_TYPOGRAPHY_PRESETS` (`INDUSTRIAL_IMPACT`, `AGRO_ROBUST`, `RETAIL_CLASSIC`, `TECH_PRECISION`) e `WHITE_LABEL_SEGMENT_PRESETS` (`AGRO_VET`, `SUPERMARKET_MEAT`, `HARDWARE_MACHINERY`, `PET_PHARMA`) em `src/core/businessRules.ts`, conectados às actions `applyTypographyPreset` e `applySegmentPreset` em `src/core/store.ts` e à interface de configuração em `src/ui/BrandKitModal.tsx`.
  - Parametrizadas as cores de alerta (`alertPrimaryColorHex` e `alertAccentColorHex`) em `TenantBrandKit` (`src/core/types.ts`) e `resolveThemePalette` (`src/engine/PosterAndSocialCanvas.tsx`), eliminando qualquer cor ou fonte hardcoded e adicionando os atributos semânticos `data-sku-code`, `data-brand-name`, `data-font-heading` e `data-font-body` em todos os cartazes e cards sociais.
- **FEAT-11 (Hub Universal de Base de Dados & Conector ERP Multi-Sistema — `ErpIntegrationModal.tsx`)**:
  - Criada função `normalizeUniversalErpDataset` em `src/core/businessRules.ts` capaz de detectar e higienizar automaticamente cargas JSON aninhadas ou planas (**Bling, Tiny, TOTVS Protheus, Sankhya, Siagri, Linx, Omie e APIs REST**) e planilhas CSV/TSV/Excel com ou sem cabeçalho, extraindo SKU, código de barras EAN-13 (`eanBarcode`), título limpo, unidade/peso, preço De/Por, custo, parcelamento (`parcelas`) e condição/brinde (`condicao`/`brinde`).
  - Criado componente `src/ui/ErpIntegrationModal.tsx` (acessível pelo botão `🔌 Base ERP` no cabeçalho ou atalho `Alt+E` em `src/App.tsx`) com importação de arquivos `.csv`/`.tsv`/`.json`, botões de simulação imediata (`Bling/Tiny JSON` e `TOTVS/Sankhya CSV`), sincronização remota via URL/Planilha Google Sheets publicada, exportação CSV (`exportCatalogToCsv`) e persistência offline (`customCatalogDb` em `localStorage` `schemaVersion: 3`).
  - Adicionado dropdown de **Autocomplete Instantâneo** no campo de SKU em `src/App.tsx` (`searchErpCatalog`), permitindo buscar por Código SKU, Código de Barras EAN-13 (`789...`) ou trecho do nome do produto.
- **FEAT-12 (Lote Misto Multi-Arquétipo Automático em A4 / A5 / Gôndola 2x2)**:
  - Aprimorado `StorePosterA4Sheet` (`src/engine/PosterAndSocialCanvas.tsx`) e `parseBatchInput` (`src/core/store.ts`) para que, no Modo Lote (`batchMode = true`), cada slot da folha resolva individualmente o seu `recommendedArchetype` (`PROMO_CLASSIC_V`, `CLEAN_DIRECT_PRICE`, `MACHINERY_INSTALLMENT` ou `CONDITION_ADVANTAGE`), permitindo imprimir na mesma folha A5 ou Gôndola 2x2 produtos de diferentes naturezas comerciais sem perder os contratos `data-*`.

---

## [1.1.0] - 2026-10-18

### Adicionado
- **FEAT-07 (4 Modelos/Arquétipos de Cartazes de Loja 100% White-Label — `PosterLayoutArchetype`)**:
  - Implementado o tipo `PosterLayoutArchetype` em `src/core/types.ts` e os 4 templates dedicados em `SingleStorePosterUnit` (`src/engine/PosterAndSocialCanvas.tsx`), todos compatíveis com Folha Inteira (`A4_FULL`), Meia-Folha (`A5_HALF`) e Gôndola Quadrada (`GONDOLA_2X2`), além de impressoras Laser Toner P&B (`BW_ECO_TONER`) e Coloridas:
    1. **Modelo 01 (`PROMO_CLASSIC_V` — Promoção De/Por)**: Cabeçalho em V clássico, selo `% OFF` e contraste de ancoragem DE riscado vs POR monumental.
    2. **Modelo 02 (`CLEAN_DIRECT_PRICE` — Preço Direto / Gôndola Limpa)**: Layout quadrado/direto sem poluição de "De/Por", com moldura arquitetônica limpa, alta economia de toner P&B, foco em título gigante + preço direto imediato.
    3. **Modelo 03 (`MACHINERY_INSTALLMENT` — Maquinário / Parcelado Sem Juros)**: Voltado para venda consultiva de maquinários, motores, trituradores e implementos agrícolas onde a **condição de parcelamento** (`EM ATÉ 10X SEM JUROS DE R$ 189,90`) é o destaque monumental central e o valor total à vista (`PREÇO À VISTA: R$ 1.899,00`) é exibido em conformidade estrita com o CDC (Lei Federal 10.962/04 / Art. 52).
    4. **Modelo 04 (`CONDITION_ADVANTAGE` — Destaque Condição / Compre & Ganhe / Combo)**: Onde o banner central destaca a vantagem comercial (`COMPRE 1 E GANHE BALDE DOSADOR`, `COMPRE 2 PELO PREÇO DE 1`, `LEVE 3 PAGUE 2`, `ATACADO`) acima do bloco de preço.
  - Garantida governança **Zero Hardcode / 100% White-Label** e **Elementos Core Obrigatórios** (`renderCoreGovernanceFooter` em `src/engine/PosterAndSocialCanvas.tsx`): todos os 4 modelos de cartaz e os cards de redes sociais (`SocialMediaCardCanvas`) injetam dinamicamente as cores (`resolveThemePalette` com contraste WCAG 2.1), fontes (`fontHeading`, `fontBody`), logotipo (`defaultLogoUrl`) e nome da loja (`companyName`) do `brandKit`, além de exibir obrigatoriamente **Título Limpo**, **Código do Produto (`CÓD: {skuCode}`)**, **Preço/Condição**, **Vigência PROCON**, **ID Forense (`#AP-XXXX-XXX`)** e **Rodapé Legal MAPA/CRMV**, preservando todos os atributos `data-*` (`data-poster-template`, `data-poster-archetype`, `data-sheet`, `data-slots`, `data-price-integer`, `data-price-cents`, `data-effective-price`, `data-price-per-measure`, `data-guardrail-status`).
- **FEAT-08 (Novas Mecânicas Comerciais de Parcelamento e Compre & Ganhe + Smart Paste Inteligente)**:
  - Adicionadas as mecânicas `'INSTALLMENT_FINANCING'` (Parcelado Sem Juros / Maquinário com seletor rápido `2x..12x` e toggle `Sem Juros`) e `'BUY_WIN_GIFT'` (Compre & Ganhe / Brinde com texto customizável e presets rápidos) em `src/core/types.ts`, `src/core/businessRules.ts`, `src/core/resolve.ts`, `src/core/store.ts` e `src/App.tsx`.
  - Expandido `cleanErpProductTitle` com siglas de maquinários agrícolas (`TRIT`, `FORRAG`, `MOTOS`, `GERAD`, `ORDENH`, `BETON`, `GASOL`, `TRF`, `BIVOLT`) e correção de erros de digitação (`motoserra`, `forragero`, `betonera`).
  - Evoluído `parseWhatsAppSmartPaste` (`src/core/businessRules.ts`) para reconhecer automaticamente ofertas parceladas (`em 10x sem juros de 189,90`), promoções `compre 1 e ganhe ...` e `compre 2 pelo preço de 1`, calculando o preço total e selecionando automaticamente o arquétipo de cartaz ideal (`recommendedArchetype`).
- **FEAT-09 (Conector Universal de Catálogo ERP por Código SKU e Importação JSON/CSV)**:
  - Criada interface `ErpCatalogRecord` / `ErpCatalogLookupPort` (`src/core/types.ts`), banco local de demonstração `DEFAULT_ERP_CATALOG_DB` e função `lookupErpCatalogBySku` (`src/core/businessRules.ts`) integrada à action `lookupAndApplyErpSku` (`src/core/store.ts`).
  - Adicionado botão `🔍 Buscar ERP` e atalhos de teste rápido (`#101 Ração`, `#201 Triturador 10x`, `#301 Mineral + Brinde`) no campo de Código Interno / SKU em `src/App.tsx`, preenchendo automaticamente título limpo, preço, custo, mecânica e modelo de cartaz ao digitar o SKU e pressionar `Enter`.
  - Adicionado suporte nativo a arrays JSON de qualquer ERP/API em `parseErpBatchTable` (`src/core/businessRules.ts`) além de CSV/TSV/Pipe do Excel.

---

## [1.0.1] - 2026-10-18

### Adicionado
- **FEAT-04 (Ajuda Contextual Hover/Teclado & Operação 100% Sem Mouse)**:
  - Criado componente `HelpHint` em `src/App.tsx` com suporte a mouse (`hover`) e foco via teclado (`Tab` / `focus`), exibindo instruções rápidas em todos os blocos críticos (Smart Paste, Lote ERP, Mecânicas Comerciais, Arredondamento Psicológico, Vigência PROCON, ID Forense e Opções do Gerente).
  - Adicionados atalhos globais de teclado em `src/App.tsx` para computadores de balcão/caixa sem mouse: `Alt+V` (foca no Smart Paste), disparo automático no `Ctrl+V` (`onPaste`), `Alt+1` / `Alt+2` (alterna entre Redes Sociais e Cartazes A4), `Alt+L` (limpa siglas), `Alt+M` (abre/fecha Marca), `Esc` (fecha modais) e `Ctrl+P` (imprime folha A4).
- **FEAT-05 (Análise Instantânea de Imagem & Recorte Adaptativo de Fundo)**:
  - Criada função `analyzeProductImageLocal` em `src/engine/exporter.ts` que avalia a foto enviada em milissegundos (resolução para 1080p, percentual de transparência livre e cor dominante da embalagem) exibindo badge de diagnóstico ao operador.
  - Aprimorado o algoritmo `tightCropAlphaDataUrl` em `src/engine/exporter.ts` com amostragem dinâmica dos 4 cantos da imagem para remover não apenas branco puro (`#FFFFFF`), mas também fundos off-white e cinza-claro de estúdio, mantendo toggle rápido (`Remover fundo claro`) para preservar fundos originais quando desejado.
- **FEAT-06 (Auto-Reparo de Erros de Digitação e Travas de Preço em 1 Clique)**:
  - Adicionado dicionário determinístico `RETAIL_TYPO_DICTIONARY` e expansão de siglas em `cleanErpProductTitle` e `detectRegulatoryCategoryByText` (`src/core/businessRules.ts`), corrigindo automaticamente erros comuns de digitação no balcão (ex: `racao`, `glifozato`, `erbicida`, `vermifogo`, `pulverisador`, `calcareo`) e garantindo acionamento das travas do MAPA/CRMV mesmo com erro ortográfico.
  - Criada action `autoFixPriceGuardrail` em `src/core/store.ts` com botões de correção de 1 clique (`⇄ Inverter DE/POR` e `⚡ Ajustar p/ Margem`) diretamente nos alertas de bloqueio em `src/App.tsx`.

### Corrigido
- **BUG-VIS-04 (Escala de Preço de 4+ Dígitos no Card Social & Conversão de Gramas/ML)**:
  - Ajustada a escala tipográfica do bloco de preço em `SocialMediaCardCanvas` (`src/engine/PosterAndSocialCanvas.tsx`) para valores de 4 ou mais dígitos (`R$ 1.299,90`), evitando compressão horizontal.
  - Corrigida a conversão automática de medidas separadas por espaço em `cleanErpProductTitle` (`src/core/businessRules.ts`), garantindo que `500 G` ou `500 ML` calculem corretamente o preço proporcional por KG ou Litro exigido pelo CDC.
- **BUG-VIS-05 (Escala Compacta Dedicada para Gôndola 2x2 — `isGondola`)**:
  - Implementada a flag `isGondola` em `resolveRenderSpec` (`src/core/resolve.ts`) e `SingleStorePosterUnit` (`src/engine/PosterAndSocialCanvas.tsx`), calibrando fontes de preço (`18.5cqw` a `27.5cqw`), títulos (`4.8cqw` a `6.5cqw`) e paddings compactos para os 4 quadrantes da Gôndola 2x2 sem comprimir rodapés regulatórios MAPA.
  - Atualizados `docs/GTM_PLAYBOOK.md` (Estratégia Cavalo de Troia no WhatsApp) e `docs/TESTING_GUIDE.md` (`v1.0.1`).
- **CALC-03 (Ativação Real da Trava `BELOW_COST_MARGIN` no Preço Direto)**:
  - Corrigida condição em `applyCommercialRounding` (`src/core/businessRules.ts`) que elevava silenciosamente qualquer `rawValue <= floorCostPrice` para `Math.ceil(floorCostPrice) + 0.90` mesmo no modo `NONE`, o que impedia que o guardrail `BELOW_COST_MARGIN` bloqueasse a exportação (`canExport = false`) quando o operador digitava um preço abaixo do custo. Agora o piso só atua quando `rawValue > floorCostPrice` e um arredondamento para baixo (`INTEGER_DOWN` / `PSYCH_XX`) cruzaria o custo, garantindo bloqueio imediato e auditado em 18/18 testes automatizados.

---

## [1.0.0] - 2026-10-17

### Adicionado
- **FEAT-01 (Sprint Final 1 — Modal White-Label de Configuração da Marca em 60s)**:
  - Criado componente `src/ui/BrandKitModal.tsx` substituindo o `window.prompt` provisório do botão `⚙ Marca` em `src/App.tsx`.
  - Configuração rápida de Nome da Empresa/Rede (`companyName`), Filial Padrão (`defaultBranchName`), Telefone/WhatsApp Comercial (`defaultPhoneWhatsapp`), Registro MAPA (`mapaRegistrationCode`) e Upload de Logotipo Oficial (`defaultLogoUrl`) com recorte e remoção de fundo branco via `tightCropAlphaDataUrl`.
  - Edição ao vivo dos 2 Departamentos/Submarcas (`updateDepartment` e `updateBrandKit` em `src/core/store.ts`) com seletor de ícones de varejo (`leaf`, `heart`, `meat`, `cart`, `pill`, `tool`), seletores de cor Primária, Secundária e Destaque, e validação em tempo real de contraste WCAG 2.1 (`getContrastRatio` e `resolveAccessibleTextColor`).
- **FEAT-02 (Sprint Final 2 — Remoção de Fundo Branco de Catálogo & Polimento Visual Social)**:
  - Aprimorada a função `tightCropAlphaDataUrl` em `src/engine/exporter.ts` com algoritmo Flood-Fill 4-conectado a partir das bordas da imagem (`RGB >= 242` neutro) e suavização anti-halo nas bordas do produto, tornando transparente o fundo branco chapado de fotos JPG de catálogo sem afetar textos ou detalhes brancos no interior do rótulo.
  - Aprimorado `SocialMediaCardCanvas` em `src/engine/PosterAndSocialCanvas.tsx` para exibir o logotipo oficial do `brandKit`, o selo dinâmico de mecânica comercial (`mechanicBadgeText`), o contato de WhatsApp no bloco de CTA e todos os atributos semânticos `data-*` de auditoria.
  - Sincronizada a cor de borda dinâmica (`borderColor: palette.headerBg`) em `SingleStorePosterUnit` e adicionado botão rápido para remover foto enviada em `src/App.tsx`.
- **FEAT-03 (Sprint Final 3 — Portão Comercial Freemium Lock + Cota de Teste)**:
  - Criado componente `src/ui/PaywallModal.tsx` e barra fixa de rodapé em `src/App.tsx` exibindo o consumo mensal (`X / 30 artes grátis no mês`) com atributos semânticos `data-freemium-tier`, `data-freemium-used` e `data-freemium-limit`.
  - Implementadas as actions `consumeExportQuota`, `activateLicenseKey` e `setPlanTier` em `src/core/store.ts`, bloqueando exportações acima da cota gratuita e permitindo upgrade imediato via checkout externo ou ativação de chave `ALFA-`/`PRO-`.
  - Atualizados `PRODUCT_VISION.md` e `package.json` (`v1.0.0`) consolidando a entrega integral do escopo comercial MVP.

---

## [0.3.0] - 2026-10-17

### Corrigido
- **BUG-VIS-01 (Preço e Rodapé Cortados em Meia-Folha A5)**:
  - Adicionado suporte a `isA5Half` em `resolveRenderSpec` e `SingleStorePosterUnit`.
  - Redimensionamento proporcional das fontes de preço monumental (`19cqw`/`16cqw`/`13cqw`) e título (`text-[3.8cqw]` a `text-[5.4cqw]`).
  - Redução de paddings verticais no cabeçalho e rodapé em layouts horizontais de meia-folha, eliminando o overflow de 177px (comprovado com `posterScrollHeight === posterClientHeight` no DOM).
- **BUG-VIS-02 (Subtítulo no Formulário de Cartazes)**:
  - Campo de input de texto para `subtitle` tornado comum a ambos os módulos (`STORE_POSTER` e `SOCIAL_MEDIA`), posicionado logo abaixo do Nome do Produto.
- **BUG-VIS-03 (Feedback Visual de Limite de Título)**:
  - Inclusão de contador de caracteres `{currentOffer.rawTitle.length}/48`.
  - Destaque com borda âmbar e aviso de governança quando o título atinge 42 caracteres, alertando para risco de perda de legibilidade a 2 metros de distância.
- **CALC-01 (Cálculo de Preço por Kg no Leve X Pague Y - CDC/Decreto 5.903)**:
  - Implementação da fórmula exata quando o produto possui peso/volume (`netWeightOrVolume`):
    `Preço por kg = (finalPriceTo * payQty) / (netWeightOrVolume * takeQty)`.
- **CALC-02 (Parametrização da 2ª Unidade % OFF)**:
  - Adicionado campo `secondUnitDiscountPercent` em `OfferItemState` e input numérico customizável na interface (permitindo 20%, 30%, 50%, 70% OFF) com cálculo dinâmico do preço médio unitário ponderado.

### Adicionado
- **Reorganização Ergonômica da Interface (Fluxo de 10 Segundos)**:
  - **Mecânica Comercial no Topo do Formulário**: O operador define primeiro o tipo de promoção para que os campos de valores façam sentido imediato.
  - **Seletor de Temas Visuais Horizontal**: Substituição de botões verticais empilhados por grid horizontal (`[ Preto & Branco ]`, `[ Tema Azul ]`, `[ Tema Verde ]`) posicionado acima da folha de preview.
  - **Seletor de Formato Acoplado à Folha**: Botões `[ 1 POR FOLHA ]`, `[ 2 POR FOLHA ]`, `[ 4 POR FOLHA ]` posicionados logo acima da folha para feedback visual instantâneo.
  - **Cruzeta de Corte Única para Gôndola (4x)**: Substituição de bordas e paddings individuais por uma única linha de corte central contínua (horizontal e vertical com ícone ✂), otimizando o refile com guilhotina.
  - **Simplificação Radical do Modo Lote**: O formulário manual de cadastro individual é ocultado quando `batchMode` está ativo, exibindo exclusivamente estatísticas do lote (`data-batch-total`, `data-batch-valid`), importação de dados, tabela de conferência e botão de impressão em massa.
  - **Contrato Semântico para Testes Automatizados**: Inclusão de atributos `data-sheet`, `data-slots`, `data-price-integer`, `data-price-cents`, `data-effective-price`, `data-price-per-measure` e `data-guardrail-status`.
  - **Transparência em Alertas de Governança**: Exibição inline das regras de bloqueio violadas diretamente sobre o banner de exportação, eliminando qualquer dúvida do operador sobre o motivo da trava.

---

## [0.2.0] - 2026-10-16

### Adicionado
- **Multi-SKU no Cartaz A4/A5/Gôndola**: Suporte a preenchimento de slots de Meia-Folha A5 (2x) e Gôndola (4x) com produtos distintos do lote de importação rápida.
- **Paginação Automática para Impressão**: Quebra automática de páginas (`breakAfter: 'page'`) quando o número de itens válidos ultrapassa a capacidade de uma folha.
- **Tipografia Dinâmica Conectada**: Integração de `resolveRenderSpec` tanto em `SingleStorePosterUnit` quanto em `SocialMediaCardCanvas`, escalonando tamanhos de fonte de título (`titleScaleClass`) e preço monumental (`integerPriceFontSizeCqw`).
- **Contraste Acessível WCAG 2.1**: Implementação de `resolveAccessibleTextColor` e `getContrastRatio` no cálculo da paleta de temas (`resolveThemePalette`), garantindo legibilidade do texto para qualquer cor primária ou secundária cadastrada.
- **Controles de Redes Sociais na UI**:
  - Seletor de Tema Visual Social (`setSocialVisualTheme`).
  - Toggle de Guias de Zona Segura para Story/Status (`toggleSocialSafeZones`).
  - Toggle de Diferenciais/Bullets (`toggleSocialBullets`).
- **Controles de Mecânicas Comerciais na UI**:
  - Inputs numéricos para `takeQty` e `payQty` na mecânica *Leve X Pague Y*.
  - Input numérico para `minWholesaleQty` na mecânica *Atacado/Safra*.
  - Seletor e input de data para vigência personalizada (`CUSTOM_DATE`).
- **Tight Crop Local via Canvas 2D**: Recorte automático de margens transparentes ou fundos brancos residuais em fotos de produtos enviadas pelo usuário (`tightCropAlphaDataUrl`), rodando 100% no cliente a custo R$ 0.
- **Compartilhamento Mobile via Web Share API**: Opção de exportação direta para o WhatsApp com fallback para download e redirecionamento web.
- **ID Forense em Todos os Rodapés**: Exibição do código `#AP-XXXX-XXX` tanto no cartaz A4 quanto nos cards de redes sociais para auditoria de gôndola.

### Corrigido
- **Mojibake no Cabeçalho**: Caractere corrompido substituído pelo ícone `🖨️` na aba de Cartazes de Loja.
- **Custo no Modo Lote**: Adicionado envio de `costPrice` ao selecionar um item da planilha, ativando a trava de segurança anti-prejuízo (`BELOW_COST_MARGIN`) no formulário.
- **Faixa Regulatória no Cartaz A4**: Exibição corrigida para insumos MAPA (`AGRO_FERTILIZER_SEED`) e produtos com validade próxima (`NEAR_EXPIRY`), mesmo quando não classificados como alto risco agronômico.
- **Condição de Corrida na Impressão**: Uso do evento nativo `onafterprint` com fallback de 60s no `printOrSaveA4Sheet`, evitando fechamento precoce do diálogo de impressão.
- **Smart Paste do WhatsApp**: Blindagem completa contra falsos positivos com números de peso decimal (`10.1kg`), formulações NPK (`10-10-10`), valores com separador de milhar (`1.299,90`) e contagem de doses.
- **Enriquecimento Automático no Smart Paste**: Chamada automática ao `enricherService` para geração instantânea de subtítulo e diferenciais ao colar texto do WhatsApp.

---

## [0.1.0] - 2026-10-16

### Adicionado
- **Estrutura Base do Projeto**: Vite 6 + React 18.3 + TypeScript + Tailwind CSS v4.
- **Core de Tipos e Modelagem de Domínio**: `types.ts` com suporte a planos, BrandKit multi-tenant, mecânicas comerciais, guardrails de conformidade e grade de impressão.
- **Motor de Regras de Negócio e Compliance**: `businessRules.ts` com limpador de siglas de ERP, parser de moeda BRL, arredondamento psicológico comercial (,90 / ,99 / Inteiro), regras PROCON de vigência e detector regulatório (MAPA/CRMV/CONAR).
- **Gerenciador de Estado Reativo**: `store.ts` via `useSyncExternalStore` nativo com persistência local e suporte a modo individual e modo lote.
- **Motor de Renderização Responsivo**: `PosterAndSocialCanvas.tsx` utilizando CSS Container Queries (`inline-size` e `cqw`) para auto-ajuste de escalas sem distorção.
- **Documentação Estratégica**: `PRODUCT_VISION.md` definindo o norte do produto, anti-escopo, 6 princípios inegociáveis e roadmap de 4 fases.
