# Sistema Visual e Governança — Hub Coagro

**Status:** Direção aprovada para a primeira implementação  
**Atualização:** 11 de novembro de 2026  
**Escopo desta entrega:** diagnóstico, direção visual e linha oficial de identificação.

## 1. Diagnóstico

O Hub já possui um motor determinístico sólido: `RenderSpec`, regras de preço/compliance,
exportação local e contratos DOM de auditoria. O principal débito está na camada de comunicação:

- categorias diferentes ainda compartilham aparência de formulário genérico;
- o Brand Hub misturava biblioteca de marca, campanhas, diretório e produção sem uma hierarquia
  clara;
- os dados editáveis não tinham limites explícitos em alguns fluxos de RH e papelaria;
- a identidade Coagro aparecia de forma inconsistente entre azul oficial, verde e versões Pet;
- o modelo de crachá não existia no produto e o cartão estava tratado apenas como uma prévia
  genérica.

## 2. Referências analisadas

> A pasta local `marca e ideias/` contém material bruto e referências de terceiros;
> ela não é versionada. Os ativos usados em produção são os SVGs embutidos em
> `src/ui/coagroLogos.tsx`, portanto o build não depende dessa pasta.

### Manual de marca local

O manual em `marca e ideias/MANUAL DE MARCA COAGRO (1).pdf` confirma:

- logotipo horizontal e vertical como ativos prioritários;
- azul titular, verde institucional e laranja/amarelo como acentos da marca;
- tipografia de referência Exo 2.0 para títulos e comunicação de tecnologia/inovação;
- uso do símbolo casinha/folha como elemento de reconhecimento, sem necessidade de ilustração
  decorativa adicional.

### Crachá de referência

`marca e ideias/Crachá 2024 2 modelo hd.png` orienta a estrutura, não uma cópia literal:

- fundo azul profundo com textura discreta de marca;
- painel branco central para identificação legível;
- faixa em V laranja/amarela como assinatura visual;
- base branca com categorias e logo oficial.

### Papelaria e cartão

`marca e ideias/cartão de visita.pdf` e `SL-031720-29020-09.jpg` reforçam uma regra de
composição: muito respiro, logo em área protegida, blocos geométricos simples e informações
curtas. A referência genérica de papelaria foi interpretada, sem importar a marca ou os textos
de terceiros.

### Sites institucionais

As URLs fornecidas foram consideradas como referência de contexto institucional. Como o portal de
marca informado retornou indisponibilidade durante a análise, os ativos locais e o manual de marca
foram tratados como fonte primária desta primeira implementação.

## 3. Direção visual Coagro v1

| Token | Uso | Valor |
| --- | --- | --- |
| Azul oficial | base institucional, títulos sobre claro e fundos de identificação | `#002B49` |
| Azul royal | fundo de crachá e materiais de identificação | `#001C71` |
| Verde safra | apoio, status e navegação de governança | `#004D40` |
| Laranja/amarelo | acento, V de identificação e chamada | `#F28A16` / `#FFAB00` |
| Branco | área de leitura e respiro | `#FFFFFF` |

### Regras de composição

1. Um único foco visual por peça: pessoa, produto ou mensagem.
2. Logo sempre em área de contraste suficiente e sem distorção.
3. Dados variáveis entram apenas em slots homologados.
4. Textos de pessoa, cargo, setor e contato possuem limites de caracteres.
5. Nenhum template oferece drag-and-drop, troca livre de fonte ou cor.
6. Pet permanece isolado ao departamento/unidade homologados.
7. Preview e exportação usam o mesmo DOM e a mesma composição determinística.

## 4. Biblioteca de templates implementada

### Identificação

- `CoagroBadgeTemplate`: crachá vertical oficial com fundo azul, painel branco, faixa em V,
  logo e matrícula/unidade.
- `CoagroBusinessCardTemplate`: cartão 9 × 5 cm com base azul, recorte geométrico laranja,
  localização, contato e marca oficial.
- Campos permitidos: nome, cargo, setor, matrícula, telefone, e-mail e foto.
- A foto é apenas conteúdo; tamanho, recorte e posição permanecem travados.

### RH e comunicados

- Canais separados: mural físico A4, comunicação interna digital e comunicado formal.
- Toner P&B só é aceito no mural físico A4.
- Limites de caracteres foram aplicados aos campos de referência, chamada, assunto, localização,
  destaque, orientações e contato.
- A prévia RH passou a carregar logo oficial e a expor `data-hr-channel` para auditoria.

## 5. Próximas etapas priorizadas

1. Extrair `HrAndNoticeCanvas` em arquétipos internos reutilizáveis (vaga, comunicado, segurança,
   feriado) sem duplicar regras de canal.
2. Refazer `PROMO_CLASSIC_V` como referência comercial oficial e revisar os demais arquétipos por
   hierarquia de preço, leitura móvel e impressão.
3. Transformar campanhas e stories do Brand Hub em assets exportáveis reais, sem botões que apenas
   simulem download.
4. Criar papel timbrado, assinatura e correspondência a partir dos mesmos tokens de identificação.
5. Adicionar matriz de testes visuais para textos curtos/longos, fotos ausentes e proporções de
   exportação.

## 6. Critério de aceite

Uma peça só entra na biblioteca oficial quando:

- mantém a hierarquia em conteúdo curto e longo;
- não sobrepõe logo, rodapé, preço ou contato;
- respeita os atributos semânticos existentes;
- exporta fielmente ao preview;
- não permite decisão de design desnecessária ao operador;
- possui uso, canal e categoria documentados.
