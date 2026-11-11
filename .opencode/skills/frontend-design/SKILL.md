---
name: Frontend Design
description: Direção de design para o Hub Coagro e para qualquer interface do repositório. Use ao criar, redesenhar ou revisar UI para garantir identidade própria, hierarquia intencional e ausência de padrões genéricos de template.
---

# Frontend Design

Aproxime cada tela como o diretor de design de um estúdio conhecido por dar a
cada cliente uma identidade que não se confunde com nenhuma outra. O Hub Coagro
já rejeita propostas clichês: faça escolhas deliberadas de paleta, tipografia e
layout específicas para o universo agroindustrial, editorial e operacional do
Grupo Coagro. Assuma risco estético quando ele servir ao produto.

## Comece pelo assunto

Antes de desenhar, identifique o produto, o público e o trabalho principal da
tela. No Hub Coagro, a leitura de base é:

- **Produto:** central interna de comunicação, identidade e produção de peças
  oficiais do Grupo Coagro e Coagro Pet.
- **Público:** operadores de balcão, gerentes de loja, marketing e curadoria.
- **Trabalho principal:** preencher informações com segurança e receber uma peça
  pronta, consistente e imprimível, sem precisar tomar decisões de design.

Use o conteúdo real do Hub. Não preencha a interface com textos de vitrine,
números decorativos ou rótulos que não ajudem alguém a produzir uma peça.

## Princípios de design

- **A arte é o herói.** A prévia do material gerado é sempre o elemento de maior
  peso visual da tela. A interface ao redor deve parecer uma mesa de produção,
  não um dashboard genérico.
- **A marca é estrutura.** Azul, verde, ouro, Exo 2 e Inter não são decoração;
  organizam estados, ações, códigos, unidades e materiais.
- **Densidade controlada.** Ferramentas de operação devem ser rápidas de ler.
  Agrupe por tarefa, não por quantidade de campos.
- **Uma ousadia por tela.** Escolha um gesto memorável — uma tarja, uma prévia
  sobre papel, um contraste de cor — e mantenha o restante disciplinado.
- **Números só para sequências.** Marcadores `01 / 02 / 03` só aparecem quando
  representam etapas reais de um fluxo.
- **Sem labels em caixa alta decorativos.** Rótulos existem para orientar; use
  caixa de frase e peso tipográfico em vez de tracking artificial.
- **Ações dizem o que acontecem.** `Baixar PNG`, `Enviar para curadoria` e
  `Copiar assinatura` são exemplos de vocabulário direto e consistente.
- **A interface não pede decisões de design.** O usuário escolhe conteúdo e
  canal; a composição, as margens, a escala e a tipografia ficam travadas.

## Tipografia

- `Exo 2` para títulos, nomes próprios, preços e displays.
- `Inter` para corpo, formulários, metadados e rodapés.
- Não introduza uma terceira família sem necessidade real.
- Trabalhe com pesos claros: display 700–900; interface 400–600.
- Use `font-variant-numeric: tabular-nums` para preços e medidas.
- Prefira frases curtas e line lengths abaixo de 80 caracteres.

## Cor

- Azul Coagro `#001C71` como âncora institucional.
- Azul profundo `#001242` para superfícies de contraste.
- Papel frio `#F2F6F7` para a mesa de trabalho.
- Verde `#2E8B3C` para apoio e confirmação.
- Ouro `#FFAB00` para ação, corte, destaque e foco.
- Tinta `#14262E` para texto principal.
- Não use gradientes decorativos, sombras difusas em todos os cards ou uma
  paleta “SaaS” de violeta/azul neon.

## Layout

O conceito do Hub é uma **mesa de prova editorial**:

```text
┌───────────────┬──────────────────────────────────────────────┐
│ índice da     │  cabeçalho de trabalho                       │
│ unidade       │  contexto · ação principal                   │
│               ├──────────────────────────────────────────────┤
│ módulos       │  editor discreto  │  peça em prévia         │
│               │                   │  (papel / palco)         │
│ status        │  campos guiados   │  medidas e exportação    │
└───────────────┴──────────────────────────────────────────────┘
```

- A navegação é um índice, não uma lista de cards.
- A prévia fica sobre uma superfície própria, com réguas e marcas de corte
  discretas; ela deve parecer um material físico.
- Cards podem existir, mas não todos com o mesmo raio, sombra e peso. Use linhas,
  divisórias e superfícies contínuas para criar hierarquia.
- Cantos pequenos (4–8 px) para UI de produção; materiais gerados podem manter
  seus próprios raios.
- Alinhamento predominante à esquerda. Centralize apenas o que é objeto: selo,
  peça, assinatura ou logo.

## Movimento

- Use movimento para responder a ações: abrir painel, trocar módulo, confirmar
  exportação.
- Evite sequências de fade/slide em todas as seções e hover em cada card.
- Respeite `prefers-reduced-motion`.

## Cópia

- Escreva do ponto de vista de quem opera: “Unidade ativa”, “Dados da oferta”,
  “Prévia do cartaz”.
- Não use slogans internos onde o usuário precisa de instrução.
- Erros explicam o que aconteceu e como corrigir, sem culpar a pessoa.
- Vazio é convite à ação: “Envie uma foto para gerar o perfil” em vez de
  “Nenhum dado encontrado”.

## Processo obrigatório

1. Identifique o assunto, o público e o trabalho da tela.
2. Escreva um plano compacto com cor, tipografia, layout e princípios.
3. Revise o plano contra padrões genéricos: se ele serviria a qualquer SaaS,
   revise antes de implementar.
4. Construa com conteúdo real e preserve contratos funcionais e de exportação.
5. Tire screenshots ou inspecione a renderização, critique e remova um acessório.
6. Valide com `npx tsc --noEmit` e com os testes existentes.

## Direção específica do Hub Coagro

Leia `references/coagro-hub.md` antes de redesenhar telas do Hub. Ele contém os
tokens, a metáfora de produto e as decisões que diferenciam esta aplicação de um
kit genérico de templates.
