# MVP-3: Tabuleiro PixiJS — Specification

## Problem Statement

O frontend possui apenas um placeholder na rota `/game` (MVP-2). O jogador não vê o tabuleiro, casas, peças ou qualquer representação visual do jogo. Sem o tabuleiro renderizado, o projeto não demonstra competência em renderização 2D (PixiJS) e as features de turno (MVP-4+) não têm onde operar. Precisamos do tabuleiro circular completo com hub central, raios, casas coloridas/HQ/Roll Again, tokens dos jogadores e seleção de peça/cor.

## Goals

- [ ] Tabuleiro circular PixiJS renderizado dentro da GamePage React (canvas WebGL)
- [ ] Hub central hexagonal visível no centro, 6 raios conectando às casas HQ na trilha circular
- [ ] 72 casas na trilha circular com cores corretas por categoria, 6 casas HQ destacadas, 12 casas Roll Again
- [ ] Tokens dos jogadores posicionados no hub central ao iniciar partida
- [ ] Jogador humano seleciona cor/peça antes de ver o tabuleiro
- [ ] Layout responsivo ao container (escala sem distorção em resoluções ≥ 1280×720)

## Out of Scope

| Feature | Reason |
| --- | --- |
| Rolagem de dado e animação de dado | Pertence ao MVP-4 (Lógica de Turno) |
| Movimentação animada de peças | Pertence ao MVP-4 |
| Destaque visual de casas válidas para movimento | Pertence ao MVP-4 |
| Modal de perguntas / feedback acerto-erro | Pertence ao MVP-4 |
| Fatias visuais no token do jogador | Pertence ao MVP-5 |
| Animações avançadas (física, efeitos) | Pertence a Fase 2 (F2-2) |
| Efeitos sonoros | Pertence a Fase 2 (F2-3) |
| Responsividade mobile / tablets | Explicitamente fora de escopo (PROJECT.md) |
| Topologia/grafo de adjacência para navegação | Já existe no backend (board.config.ts); frontend apenas renderiza |
| Interação de clique em casas do tabuleiro | Pertence ao MVP-4 (seleção de destino) |
| Painel lateral de status de jogo (HUD) | Será mínimo/informativo neste MVP; expansão no MVP-4+ |

---

## User Stories

### P1: Renderização do Tabuleiro Circular ⭐ MVP

**User Story**: As a player, I want to see the full game board rendered on screen so that I can visually understand the game layout before playing.

**Why P1**: O tabuleiro é o elemento visual central do jogo. Sem ele, nenhuma feature visual subsequente funciona.

**Acceptance Criteria**:

1. WHEN player navigates to `/game` (after starting a game) THEN system SHALL render a PixiJS canvas showing a circular board with 72 tiles arranged in a ring
2. WHEN the board renders THEN system SHALL display a hexagonal hub in the center of the canvas
3. WHEN the board renders THEN system SHALL display 6 spoke paths connecting the hub center to 6 HQ positions on the circular track (positions 5, 10, 15, 20, 25, 30 from board.config.ts)
4. WHEN the board renders THEN each tile on the circular track SHALL be colored according to its category following the cycle: Geography=blue, Entertainment=pink, History=yellow, Art=brown/purple, Science=green, Sports=orange
5. WHEN the board renders THEN the 6 HQ tiles SHALL be visually distinct from regular category tiles (larger, highlighted, or marked with a special indicator)
6. WHEN the board renders THEN the 12 Roll Again tiles SHALL be visually distinct (e.g., patterned or with a special icon/symbol)
7. WHEN the board renders THEN the hub central tile SHALL be visually distinct as the start/end point of the game

**Independent Test**: Navigate to `/game` after `POST /game/start` and visually verify the complete board is rendered with colored tiles, HQ markers, Roll Again markers, hub central, and 6 spokes.

---

### P1: Tokens dos Jogadores no Hub Central ⭐ MVP

**User Story**: As a player, I want to see my token and the opponents' tokens placed on the hub central so that I know where everyone starts.

**Why P1**: Tokens representam os jogadores no tabuleiro. Sem eles, não há presença visual dos participantes.

**Acceptance Criteria**:

1. WHEN the game starts THEN system SHALL place all player tokens on the hub central position (position 0)
2. WHEN multiple tokens occupy the same tile THEN system SHALL offset them slightly so all tokens are visible (not overlapping completely)
3. WHEN the board renders tokens THEN each token SHALL display the player's chosen color distinctly
4. WHEN the board renders THEN the human player's token SHALL be visually distinguishable from opponent tokens (e.g., different shape, border, or label)

**Independent Test**: Start a game with 4 players, verify all 4 tokens are visible on the hub central, each with a distinct color, and the human player's token is identifiable.

---

### P1: Seleção de Peça/Cor pelo Jogador ⭐ MVP

**User Story**: As a player, I want to choose my token color before the game board appears so that I can personalize my game piece.

**Why P1**: Personalização mínima exigida pelo roadmap. A cor selecionada é usada para renderizar o token no tabuleiro.

**Acceptance Criteria**:

1. WHEN player navigates to `/game` for the first time in a session THEN system SHALL display a color selection screen/modal before showing the board
2. WHEN the color selection screen appears THEN system SHALL offer at least 6 distinct color options for the player to choose from
3. WHEN player selects a color THEN system SHALL assign that color to the human player's token and proceed to render the board
4. WHEN player selects a color THEN system SHALL assign different colors to each opponent token automatically (no two players share the same color)
5. WHEN player has not selected a color THEN system SHALL NOT render the board (color selection is mandatory)

**Independent Test**: Navigate to `/game`, see the color picker, select a color, verify the board renders with the player's token in the chosen color and opponents in distinct other colors.

---

### P1: Integração PixiJS com React ⭐ MVP

**User Story**: As a developer, I want the PixiJS canvas properly integrated within the React component lifecycle so that the board initializes, resizes, and cleans up correctly.

**Why P1**: Integração técnica fundamental — sem ela, o canvas PixiJS não funciona dentro do React.

**Acceptance Criteria**:

1. WHEN GamePage mounts THEN system SHALL create a PixiJS Application and attach its canvas to the React DOM
2. WHEN GamePage unmounts (e.g., navigating away) THEN system SHALL properly destroy the PixiJS Application and release WebGL resources
3. WHEN the browser window is resized THEN the PixiJS canvas SHALL scale proportionally to fit its container without distortion (maintaining aspect ratio)
4. WHEN the browser does not support WebGL THEN system SHALL display a fallback message instead of the canvas

**Independent Test**: Mount GamePage, verify canvas renders. Navigate away and back, verify no memory leaks or duplicate canvases. Resize browser window, verify board scales smoothly.

---

### P1: Dados do Tabuleiro Consumidos do Backend ⭐ MVP

**User Story**: As a developer, I want the frontend board rendering to be based on the game state from the backend so that tile types and positions are consistent with game logic.

**Why P1**: O backend já define 73 tiles com tipos e categorias (board.config.ts). O frontend deve respeitar isso para consistência.

**Acceptance Criteria**:

1. WHEN the game starts THEN frontend SHALL use the game state returned by `POST /game/start` to know player positions
2. WHEN rendering tiles THEN frontend SHALL use a local board layout definition that mirrors the backend's tile data (positions 0-72, types HUB/CATEGORY/HQ/ROLL_AGAIN, categories per tile)
3. WHEN the backend board configuration changes (tile positions, types) THEN the frontend board layout definition SHALL be the only file that needs updating to match

**Independent Test**: Verify tile at position 5 renders as HQ Geography (blue), tile at position 3 renders as Roll Again, tile at position 0 renders as hub central, tile at position 1 renders as Geography (blue category tile).

---

### P2: HUD Mínimo de Informação do Jogo

**User Story**: As a player, I want to see basic game information (my nickname, current player, list of players) alongside the board so that I know the game context.

**Why P2**: Informação contextual importante, mas o tabuleiro funciona visualmente sem ela. Será expandido no MVP-4.

**Acceptance Criteria**:

1. WHEN the board is rendered THEN system SHALL display the human player's nickname somewhere visible on the page
2. WHEN the board is rendered THEN system SHALL display a player list showing all players and their token colors
3. WHEN the board is rendered THEN system SHALL indicate which player's turn it currently is (highlight or label)

**Independent Test**: Start a game, verify nickname is visible, player list shows all 4 players with colors, and the current player is indicated.

---

### P3: Legenda de Categorias

**User Story**: As a player, I want to see a legend mapping colors to category names so that I understand what each tile color represents.

**Why P3**: Nice-to-have para onboarding do jogador. Jogadores familiarizados podem jogar sem legenda.

**Acceptance Criteria**:

1. WHEN the board is rendered THEN system SHALL display an optional legend showing the 6 category colors with their names (Geografia=azul, Entretenimento=rosa, etc.)

**Independent Test**: Verify legend is visible on the game page with all 6 categories and matching colors.

---

## Edge Cases

- WHEN WebGL is not available in the browser THEN system SHALL display a user-friendly error message ("Seu navegador não suporta WebGL. Use Chrome ou Firefox atualizados.")
- WHEN game state is not available (player navigates directly to `/game` without starting) THEN system SHALL redirect to `/start`
- WHEN the window is very small (< 800px width) THEN the board SHALL still render without breaking, even if not ideal
- WHEN all 6 players have the same starting position (hub) THEN tokens SHALL be visually separated (offset/stacked)
- WHEN the PixiJS Application fails to initialize THEN system SHALL catch the error and display a fallback message

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| BOARD-01 | P1: Renderização do Tabuleiro Circular | Design | Pending |
| BOARD-02 | P1: Renderização do Tabuleiro Circular | Design | Pending |
| BOARD-03 | P1: Renderização do Tabuleiro Circular | Design | Pending |
| BOARD-04 | P1: Renderização do Tabuleiro Circular | Design | Pending |
| BOARD-05 | P1: Renderização do Tabuleiro Circular | Design | Pending |
| BOARD-06 | P1: Renderização do Tabuleiro Circular | Design | Pending |
| BOARD-07 | P1: Renderização do Tabuleiro Circular | Design | Pending |
| TOKEN-01 | P1: Tokens dos Jogadores no Hub Central | Design | Pending |
| TOKEN-02 | P1: Tokens dos Jogadores no Hub Central | Design | Pending |
| TOKEN-03 | P1: Tokens dos Jogadores no Hub Central | Design | Pending |
| TOKEN-04 | P1: Tokens dos Jogadores no Hub Central | Design | Pending |
| COLOR-01 | P1: Seleção de Peça/Cor pelo Jogador | Design | Pending |
| COLOR-02 | P1: Seleção de Peça/Cor pelo Jogador | Design | Pending |
| COLOR-03 | P1: Seleção de Peça/Cor pelo Jogador | Design | Pending |
| COLOR-04 | P1: Seleção de Peça/Cor pelo Jogador | Design | Pending |
| COLOR-05 | P1: Seleção de Peça/Cor pelo Jogador | Design | Pending |
| PIXI-01 | P1: Integração PixiJS com React | Design | Pending |
| PIXI-02 | P1: Integração PixiJS com React | Design | Pending |
| PIXI-03 | P1: Integração PixiJS com React | Design | Pending |
| PIXI-04 | P1: Integração PixiJS com React | Design | Pending |
| DATA-01 | P1: Dados do Tabuleiro Consumidos do Backend | Design | Pending |
| DATA-02 | P1: Dados do Tabuleiro Consumidos do Backend | Design | Pending |
| DATA-03 | P1: Dados do Tabuleiro Consumidos do Backend | Design | Pending |
| HUD-01 | P2: HUD Mínimo de Informação do Jogo | Design | Pending |
| HUD-02 | P2: HUD Mínimo de Informação do Jogo | Design | Pending |
| HUD-03 | P2: HUD Mínimo de Informação do Jogo | Design | Pending |
| LEG-01 | P3: Legenda de Categorias | Design | Pending |

**Coverage:** 27 total, 0 mapped to tasks, 27 unmapped

---

## Success Criteria

- [ ] Tabuleiro circular renderizado em PixiJS com todas as 72 casas + hub central visíveis
- [ ] 6 casas HQ visualmente marcadas com cor de categoria e indicador especial
- [ ] 12 casas Roll Again visualmente distintas
- [ ] 6 raios (spokes) conectando hub central às casas HQ na trilha
- [ ] Todos os tokens dos jogadores visíveis no hub central ao iniciar
- [ ] Jogador humano seleciona cor da peça antes do tabuleiro aparecer
- [ ] Canvas PixiJS escala corretamente ao redimensionar janela
- [ ] Nenhum memory leak ao navegar para fora e voltar à página de jogo
