# State

**Last Updated:** 2026-03-30
**Current Work:** SPOKE-NAV-RULES — In Progress (spec + design + tasks prontos; implementação pendente)

---

## Recent Decisions (Last 60 days)

### AD-033: Spoke overshoot toward hub → opposite spoke (2026-03-30)

**Decision:** Quando o dado de um spoke tile ultrapassa o hub na direção do hub (`idx + D > 5`), o destino é o tile correspondente do **raio oposto** (`SPOKES[(spokeIndex + 3) % 6].tiles[5 - k]`, onde `k = idx + D - 5`). Hub é um _waypoint_ neste caso, não um tile de destino — `canAccessHub` não bloqueia o trânsito.
**Reason:** Dead-end na direção do hub é ilógico jogo. Diâmetro completo (próprio raio + hub + raio oposto) é o eixo natural de movimentação. Hub só bloqueia pouso (destino), não trânsito.
**Trade-off:** Jogador pode chegar no raio oposto por overshoot sem ter as 6 fatias (sem acessar o hub como destino). Aceito — é movimento legítimo por um eixo diametral.
**Impact:** `board.config.ts` (T1), `turn-logic.ts` (T2), `board.config.spec.ts` (T3). Nenhuma mudança de interface ou API.

### AD-034: Hub como tile de pouso × hub como waypoint (2026-03-30)

**Decision:** `canAccessHub` controla APENAS o pouso no hub (posição 0 como destino final). Quando o dado faz overshoot através do hub em um raio, o hub é um waypoint e o destino é o raio oposto — sem bloqueio por `canAccessHub`.
**Reason:** Separação clara entre "aterrissar no hub" (requer 6 fatias → desafio final → vitória) e "transitar pelo hub" (movimento diametral, não requer 6 fatias). Regra mais intuitiva e justa.
**Trade-off:** Nenhum — a distinção é semanticamente clara.
**Impact:** Apenas o branch `idx + D > 5` de `getValidDestinations` (inaltera SDN-02/03).

---

---

## Recent Decisions (Last 60 days)

### AD-001: Extrair PROJECT.md e ROADMAP.md diretamente do PRD (2026-03-29)

**Decision:** Usar o PRD existente (artefacts/prd.md) como fonte única para inicialização do projeto, sem rodada adicional de perguntas.
**Reason:** O PRD já contém visão, objetivos, stack, escopo, restrições e roadmap detalhados.
**Trade-off:** Nenhum — o PRD é suficientemente completo.
**Impact:** Projeto inicializado rapidamente com documentação alinhada ao PRD.

### AD-003: Frontend Base — decisões de escopo e infra (2026-03-29)

**Decision:** JWT armazenado em localStorage (não sessionStorage/cookie); baseURL do Axios configurável via VITE_API_URL (default http://localhost:3001); seleção de número de oponentes adiada para MVP-4 (tela Start usa default 3); Vite como bundler; tela /game será placeholder até MVP-3.
**Reason:** localStorage persiste entre abas (melhor UX), Vite é padrão React moderno, seleção de oponentes é lógica de turno e não de infra frontend.
**Trade-off:** localStorage é vulnerável a XSS em produção, mas o projeto é local-only sem dados sensíveis.
**Impact:** Spec fechada com 20 requirements (16 P1, 3 P2, 1 P3), pronta para design.

### AD-004: Frontend architecture — local state only, no global store (2026-03-29)

**Decision:** Usar apenas `useState` local nos componentes, sem Redux/Zustand/Context global.
**Reason:** MVP-2 tem apenas 3 telas simples com estado mínimo (nickname, error, loading). Estado global é overengineering neste ponto.
**Trade-off:** Se MVP-3+ precisar de estado global (game state compartilhado), será adicionado naquela fase.
**Impact:** Menos dependências, componentes mais simples, setup mais rápido.

### AD-005: 401 redirect via window.location, não useNavigate (2026-03-29)

**Decision:** O interceptor Axios de 401 usa `window.location.href = '/login'` em vez de React Router `navigate()`.
**Reason:** O interceptor roda fora do React component tree, sem acesso ao Router context. `window.location` funciona universalmente.
**Trade-off:** Full page reload no redirect de 401 (aceitável — é caso de erro, não navegação normal).
**Impact:** Interceptor desacoplado do React Router, mais simples e robusto.

### AD-006: Tailwind dark theme via classes, sem dark mode toggle (2026-03-29)

**Decision:** Usar classes Tailwind diretamente (bg-gray-900, text-white) em vez de configurar dark mode system/class toggle.
**Reason:** Projeto é tema fixo escuro (trivia/quiz vibe), sem necessidade de toggle claro/escuro.
**Trade-off:** Sem suporte a tema claro.
**Impact:** CSS mais simples, sem lógica de theme switching.

### AD-007: Board layout — frontend mirrors backend tile data locally (2026-03-29)

**Decision:** O frontend terá uma definição local de board layout (espelhando board.config.ts do backend) em vez de buscar via API. O backend não expõe um endpoint GET /board.
**Reason:** O layout do tabuleiro é estático (73 tiles fixos). Criar um endpoint apenas para dados constantes é overengineering. Manter espelho local é mais simples e elimina uma chamada HTTP.
**Trade-off:** Se o backend mudar a configuração de tiles, o frontend precisa ser atualizado manualmente.
**Impact:** Uma constante/arquivo no frontend define os 73 tiles com posição, tipo e categoria.

### AD-008: Color selection stored client-side only (2026-03-29)

**Decision:** A cor escolhida pelo jogador e as cores atribuídas aos oponentes são armazenadas apenas no frontend (state React). O backend não conhece cores de tokens.
**Reason:** A cor é puramente visual/cosmética. O backend gerencia lógica de jogo (posição, fatias, turnos). Enviar cores ao backend não agrega valor e complica a API.
**Trade-off:** Se o jogador recarregar a página, a seleção de cor é perdida (precisa selecionar novamente).
**Impact:** Nenhuma alteração no backend. Cor é estado local do componente GamePage.

### AD-009: PixiJS como dependência direta, sem wrapper library (2026-03-29)

**Decision:** Instalar PixiJS diretamente (`pixi.js`) sem usar libraries wrapper como `@pixi/react` ou `react-pixi`.
**Reason:** Wrappers adicionam abstração desnecessária para um único canvas. Integração manual via `useRef` + `useEffect` é simples e dá controle total sobre lifecycle.
**Trade-off:** Mais código boilerplate de integração React-PixiJS.
**Impact:** Menos dependências, integração mais explícita e controlável.

### AD-010: PixiJS v8, fixed canvas 800x800, CSS scale resize (2026-03-29)

**Decision:** Usar PixiJS v8 (latest stable) com canvas lógico fixo de 800×800. Resize via CSS transform scale (não re-render). Tiles como círculos (Graphics.circle), hub como hexágono, spokes como linhas.
**Reason:** Canvas fixo simplifica cálculos geométricos. CSS scale é zero-cost (GPU). Formas geométricas simples evitam necessidade de sprites/assets externos.
**Trade-off:** Tiles circulares são menos fiéis ao tabuleiro físico (que usa quadrados), mas são mais simples de implementar e visualmente adequados.
**Impact:** Zero assets externos necessários. Board inteiro renderizado com PixiJS Graphics primitives.

### AD-011: Game state via React Router location state (2026-03-29)

**Decision:** Passar o GameState do StartPage para GamePage via `navigate('/game', { state: gameState })`. Ler com `useLocation()` no GamePage.
**Reason:** Evita estado global (mantém AD-004) e evita re-fetch desnecessário do backend. O GameState já está disponível no StartPage após POST /game/start.
**Trade-off:** Se o jogador recarregar /game, perde o state e é redirecionado para /start. Aceitável para MVP.
**Impact:** StartPage precisa de pequena modificação para passar state no navigate. GamePage lê de location.state.

### AD-012: Player colors separate from category colors (2026-03-29)

**Decision:** Cores de tokens (red, blue, green, yellow, purple, orange) são uma paleta separada das cores de categorias (azul geografia, rosa entretenimento, etc.).
**Reason:** Evita confusão visual entre "meu token é azul" e "esta casa é azul (geografia)". Paletas distintas mantêm clareza.
**Trade-off:** 12 cores no total para o jogador memorizar, mas as paletas são contextualmente distintas (tokens vs tiles).
**Impact:** Dois conjuntos de constantes de cores no frontend.

### AD-013: Spoke navigation not implemented — circular-only movement (2026-03-29)

**Decision:** O backend `getValidDestinations` só suporta movimento circular (forward/backward wrap-around) e saída do hub central. Spokes (raios) são elementos visuais apenas — o jogador não navega por eles. O movimento é: do hub → posições 1-6 diretas, do anel → forward/backward.
**Reason:** O board.config.ts existente implementa anel circular simples sem grafo de adjacência spoke. Implementar spokes navegáveis seria uma mudança significativa no backend e não é necessário para uma versão jogável.
**Trade-off:** Menos opções estratégicas que o jogo físico (onde spokes permitem atalhos).
**Impact:** Frontend calcula destinos com a mesma lógica simples do backend. Spokes são decorativos.

### AD-014: Bot turns skipped temporarily in MVP-4 (2026-03-29)

**Decision:** No MVP-4, quando o turno passa para um bot, o frontend pula automaticamente todos os bots e retorna ao jogador humano. Nenhuma ação de bot é simulada.
**Reason:** A lógica de oponentes simulados é escopo do MVP-6. MVP-4 foca exclusivamente na jogabilidade do humano.
**Trade-off:** Jogo parece single-player até MVP-6 ser implementado.
**Impact:** Frontend precisa de lógica de skip de turnos de bot, chamando advanceTurn no backend ou gerenciando localmente.

### AD-015: Token animation via PixiJS Ticker (2026-03-29)

**Decision:** Animação de movimentação de token usando `app.ticker.add()` (interpolação linear), sem lib externa como GSAP.
**Reason:** PixiJS Ticker já está disponível, lerp simples de 500ms não justifica dependência extra.
**Trade-off:** Sem easing curves sofisticadas (linear only), mas suficiente para MVP.
**Impact:** Zero dependências adicionais. TokenRenderer ganha método `animateToken()`.

### AD-016: Valid destinations computed on frontend (2026-03-29)

**Decision:** Frontend calcula destinos válidos localmente (espelhando `BoardConfig.getValidDestinations`) para feedback imediato. Backend valida no POST /game/move.
**Reason:** Evita API call extra. Frontend já espelha board data (AD-007). Resultado idêntico ao backend.
**Trade-off:** Lógica duplicada (frontend + backend), mas é simples (< 20 linhas) e já havia precedente com AD-007.
**Impact:** Novo arquivo `turn-logic.ts` com função `getValidDestinations()`. Highlights aparecem instantaneamente após rolagem.

### AD-017: Bot skip via backend advanceTurn + frontend visual sequence (2026-03-29)

**Decision:** Backend `advanceTurn` pula automaticamente jogadores bot (loop until human). Frontend mostra sequência visual dos nomes dos bots sendo pulados.
**Reason:** Abordagem mais simples: 1 mudança no backend, 0 API calls extra. Frontend faz animação local com dados que já possui.
**Trade-off:** `advanceTurn` precisará ser revertido/modificado no MVP-6 quando bots jogarem de verdade.
**Impact:** Backend: modificar `advanceTurn` com do-while. Frontend: mostrar nomes de bots em sequência (0.5s cada).

### AD-018: Game state managed via useState in GamePage (2026-03-29)

**Decision:** Estado do jogo gerenciado via `useState<GamePageState>` no GamePage, atualizado a partir de cada resposta da API.
**Reason:** Consistente com AD-004 (sem estado global). GamePage é o único componente que precisa do estado completo. Sub-componentes recebem dados via props.
**Trade-off:** Se futuro componente fora da árvore do GamePage precisar do estado, será necessário levantar para Context/store.
**Impact:** GamePage é o orquestrador central. Nenhuma nova lib de estado necessária.

### AD-019: Dice animation as React component (2026-03-29)

**Decision:** Componente de dado implementado em React/Tailwind (não como parte do canvas PixiJS).
**Reason:** Dado é texto + botão — HTML/CSS é mais natural que canvas para isso. Estilo consistente com resto da UI.
**Trade-off:** Dado visualmente separado do tabuleiro (não sobreposto nele).
**Impact:** Novo componente `DiceRoller.tsx` usando React + Tailwind.

### AD-020: Question modal and notifications as React overlays (2026-03-29)

**Decision:** Modal de pergunta e notificações implementados como overlays React (não PixiJS).
**Reason:** Texto longo, botões de resposta, feedback visual — tudo mais natural em HTML/CSS. Acessibilidade e i18n muito melhores em React.
**Trade-off:** Overlay React sobre canvas PixiJS (z-index layering, mas funciona bem).
**Impact:** Novos componentes: `QuestionModal.tsx`, `CategoryPickerModal.tsx`, `TurnNotification.tsx`.

### AD-021: Enhance answer endpoint to return full player data (2026-03-29)

**Decision:** Enriquecer resposta do `POST /questions/:id/answer` para incluir array `players[]` completo (com wedges) no `gameState`.
**Reason:** Resposta atual só retorna currentPlayer e turnPhase. Frontend precisa de wedges atualizados para exibir no HUD imediatamente após acerto em casa HQ.
**Trade-off:** Resposta levemente maior (inclui todos os jogadores), mas são apenas 4 objetos pequenos.
**Impact:** Modificar `questions.controller.ts` para incluir `players` no `gameState` do response.

### AD-030: Board Rules — spoke categories rotating pattern (2026-03-30)

**Decision:** Spoke tiles usam `CATEGORY_CYCLE[(spokeIndex + tileIndex + 1) % 6]` em vez de todos da categoria da HQ do raio.
**Reason:** Spoke tiles todos da mesma categoria tornam os raios redundantes estrategicamente. O padrão rotacional garante 5 categorias distintas por raio (todas exceto a própria HQ), maximizando variedade. A linha (cor) do raio continua sendo da cor da HQ para clareza visual.
**Trade-off:** Spoke tiles não indicam visualmente em qual raio você está pela cor. Mas a linha do raio e a HQ no final mantêm essa orientação.
**Impact:** T1 (`board.config.ts`) e T4 (`board-data.ts`) alterados. Nenhuma mudança de interface ou API.

### AD-031: Hub bloqueado até 6 fatias — parâmetro canAccessHub (2026-03-30)

**Decision:** `getValidDestinations` recebe `canAccessHub = false` como 3º parâmetro; hub excluído de todos os destinos quando `false`. Callers computam `canAccessHub = wedges.length === 6 && !mustLeaveHub`.
**Reason:** Unifica o bloqueio do hub (antes: filtro separado para `mustLeaveHub`) com a nova regra de progressão (6 fatias necessárias). Uma única flag, computada uma vez, é passada para a função.
**Trade-off:** Lógica de `mustLeaveHub` e `wedges < 6` agora fundidas — simplifica o código mas requer que callers computem `canAccessHub` corretamente (bots e humanos).
**Impact:** T1 (`board.config.ts`), T2 (`game.service.ts`), T5 (`turn-logic.ts`), T6 (`GamePage.tsx`).

### AD-032: Extensão de movimento raio↔anel — somente overshoots (2026-03-30)

**Decision:** Quando o dado ultrapassa a HQ saindo do raio (overshoot spoke→anel), os passos restantes continuam no anel (fwd e bwd). Quando o dado passa por uma HQ no anel sem parar (passagem anel→raio), o jogador pode também entrar no raio com os passos restantes. Overshoot além do hub é descartado (hub é terminal).
**Reason:** Movimento passo-a-passo (step-by-step completo) exigiria refatoração arquitetural significativa. O modelo de overshoot preserva o paradigma "jump to destination" com destinos múltiplos e mantém compatibilidade com backend/frontend atuais.
**Trade-off:** Não é idêntico ao jogo físico (onde mudança de direção ocorre passo-a-passo), mas captura a essência estratégica da conexão raio-anel sem mudança de arquitetura.
**Impact:** T1 (`board.config.ts`), T5 (`turn-logic.ts`).

### AD-029: Board Redesign — 42-tile ring + navigable spokes (2026-03-30)

**Decision:** Redesenhar o tabuleiro de 72 para 42 tiles no anel, colocar 6 HQs uniformemente (posições 7/14/21/28/35/42), e adicionar 5 spoke tiles navegáveis por raio (posições 43–72). Total de posições inalterado: 73 (0–72).
**Reason:** Distribuição mais equilibrada entre as 6 categorias; raios como caminhos estratégicos reais (não apenas decorativos). anel de 42 = 6 seções × 7 tiles (6 regulares + 1 HQ), spokes de 5 tiles = HQ a 6 passos do hub com d6.
**Trade-off:** Remove Roll Again tiles. Navegação de spokes exige algoritmo mais complexo (SPOKE_TILE_MAP, adjacência bidirecional). Frontend e backend precisam espelhar a mesma topologia (AD-007 se mantém).
**Impact:** T1 (board.config.ts), T2 (spec.ts), T3 (board-data.ts), T4 (board-layout.ts), T5 (turn-logic.ts), T6 (BoardRenderer.ts).

### AD-025: Wedge diff detection via frontend comparison (2026-03-29)

**Decision:** Frontend detects newly earned wedges by comparing `players[].wedges.length` before and after the answer API response, rather than adding a dedicated `wedgeEarned` field to the backend response.
**Reason:** Simpler approach — no backend API change needed. Frontend already has the before-state in `GamePageState.players` and the after-state from `AnswerResponse.gameState.players`.
**Trade-off:** Slightly more logic on frontend (diff comparison), but avoids coupling backend response shape to notification concerns.
**Impact:** Frontend `handleAnswer()` compares wedge arrays to detect new wedge and trigger `WedgeNotification`.

### AD-026: PlayerToken extended with wedges for PixiJS rendering (2026-03-29)

**Decision:** Add `wedges: string[]` to the frontend `PlayerToken` type so `TokenRenderer` can draw wedge segments without needing a separate data channel.
**Reason:** `PlayerToken` is already the type passed to `BoardCanvas` → `TokenRenderer`. Adding wedges here keeps the data flow simple (props-only, no extra lookup).
**Trade-off:** `buildPlayerTokens()` needs to map wedges from `PlayerData` to `PlayerToken`, adding one line.
**Impact:** `TokenRenderer.renderTokens()` has direct access to each player's wedges for arc rendering.

### AD-027: finalChallengeCategory stored in backend GameState (2026-03-29)

**Decision:** Add `finalChallengeCategory: string | null` to `GameState` interface. Backend `move()` picks the random category and stores it. Frontend reads it from the move response to know which category to fetch.
**Reason:** The random category must be determined server-side (AD-002/S4). Storing it in GameState ensures consistency if the frontend needs to re-fetch.
**Trade-off:** One more field on GameState, but it's null most of the time.
**Impact:** Backend `move()` populates when hub+6wedges; `GameController` returns it in move response.

### AD-022: mustLeaveHub re-roll policy (2026-03-29)

**Decision:** When a player has `mustLeaveHub = true` and all valid destinations from dice roll include only position 0 (impossible in practice since hub exits to positions 1-6 and dice is 1-6, so at least one non-hub destination always exists), the scenario is effectively unreachable and no special handling is needed.
**Reason:** From position 0 (hub), `getValidDestinations` returns positions forward on the ring (1-6 range). Since movement from hub goes to ring positions (never back to 0), the constraint "exclude position 0" never removes all destinations.
**Trade-off:** None — edge case is unreachable with current board topology.
**Impact:** No special re-roll logic needed. Simply filter out position 0 from valid destinations when `mustLeaveHub = true`.

### AD-023: Defeat screen placeholder until MVP-6 (2026-03-29)

**Decision:** The Defeat Screen is specified and implemented as a fully functional component, but it will only be triggered when MVP-6 (Oponentes Simulados) is complete, since only bots can trigger it by winning.
**Reason:** Building it now ensures the game-over flow is complete end-to-end. The component will be ready for integration with no additional work in MVP-6.
**Trade-off:** Component exists but cannot be naturally triggered until MVP-6.
**Impact:** Defeat screen code is testable via manual state manipulation.

### AD-024: TurnPhase extended with WAITING_FINAL_ANSWER (2026-03-29)

**Decision:** Add a new `TurnPhase.WAITING_FINAL_ANSWER` to distinguish the Final Challenge answer phase from a normal `WAITING_ANSWER`. This allows the frontend to render the distinct "Desafio Final" UI and the backend to apply victory/defeat logic specifically.
**Reason:** Reusing `WAITING_ANSWER` would require checking player wedges + position every time to determine if it's a final challenge, adding complexity. A dedicated phase makes the state machine explicit.
**Trade-off:** One more enum value to handle in both frontend and backend.
**Impact:** Backend `move()` must set `WAITING_FINAL_ANSWER` when player lands on hub with 6 wedges. Frontend renders gold-themed QuestionModal.

### AD-002: Validar suposições S1-S8 com valores sugeridos (2026-03-29)

**Decision:** Todas as 8 suposições do PRD aceitas com os valores sugeridos:

- S1: Número de oponentes selecionável pelo jogador (1-5)
- S2: Probabilidade de acerto dos oponentes = 50%
- S3: Timer de resposta opcional, 30 segundos (Fase 2 — F2-4)
- S4: Categoria do Desafio Final escolhida aleatoriamente pelo sistema
- S5: Desktop-first, sem responsividade mobile
- S6: Ordem: jogador humano primeiro, depois oponentes em sequência
- S7: Node.js ≥ 18 e npm como pré-requisitos
- S8: JWT com expiração de 2 horas
  **Reason:** Valores razoáveis para um projeto de portfólio/estudo; timer fica para Fase 2.
  **Trade-off:** Nenhum significativo — decisões podem ser revisadas se necessário.
  **Impact:** Desbloqueia especificação e implementação do MVP sem ambiguidades.

### AD-028: Add winner to answer response alongside T7 (2026-03-29)

**Decision:** Added `winner: updatedGame.winner` to the answer endpoint response in `questions.controller.ts` as part of T7, even though no task explicitly required it.
**Reason:** The design doc specifies `winner: string | null` in the answer response (`GameController` section), and frontend types (T3) expect `winner` in `AnswerResponse.gameState`. Without it, T12 (GamePage integration) would be blocked.
**Trade-off:** Minor scope addition to T7 (one line), but prevents a gap between backend and frontend expectations.
**Impact:** Frontend can detect victory directly from the answer response.

---

## Active Blockers

_Nenhum blocker ativo._

---

## Lessons Learned

_Nenhuma lição registrada ainda._

---

## Quick Tasks Completed

| #   | Description | Date | Commit | Status |
| --- | ----------- | ---- | ------ | ------ |

---

## Deferred Ideas

- [x] ~~Validar suposições marcadas com ⚠️ no PRD (S1-S8)~~ → AD-002
- [ ] Timer de resposta (30s, configurável) — mover para Fase 2 (F2-4)

---

## Todos

- [x] Especificar MVP-1: Backend Base
- [x] Design MVP-1: Backend Base
- [x] Tasks MVP-1: Backend Base
- [x] Implementar MVP-1: Backend Base (20 tasks, 5 fases)
- [x] Especificar MVP-2: Frontend Base
- [x] Design MVP-2: Frontend Base
- [x] Tasks MVP-2: Frontend Base
- [x] Implementar MVP-2: Frontend Base
- [x] Especificar MVP-3: Tabuleiro PixiJS
- [x] Design MVP-3: Tabuleiro PixiJS
- [x] Tasks MVP-3: Tabuleiro PixiJS
- [x] Implementar MVP-3: Tabuleiro PixiJS
- [x] Especificar MVP-4: Lógica de Turno
- [x] Design MVP-4: Lógica de Turno
- [x] Tasks MVP-4: Lógica de Turno
- [x] Implementar MVP-4: Lógica de Turno
- [x] Especificar MVP-5: Fatias e Vitória
- [x] Design MVP-5: Fatias e Vitória
- [x] Tasks MVP-5: Fatias e Vitória
- [x] Implementar MVP-5: Fatias e Vitória- [x] Especificar MVP-6: Oponentes Simulados
- [x] Design MVP-6: Oponentes Simulados
- [x] Tasks MVP-6: Oponentes Simulados
- [x] Implementar MVP-6: Oponentes Simulados
- [x] Especificar MVP-7: Testes
- [x] Design MVP-7: Testes (skipped — auto-sized)
- [x] Tasks MVP-7: Testes
- [x] Implementar MVP-7: Testes
- [x] Especificar BOARD-REDESIGN: Redesenho do Tabuleiro
- [x] Design BOARD-REDESIGN: Redesenho do Tabuleiro
- [x] Tasks BOARD-REDESIGN: Redesenho do Tabuleiro
- [x] Implementar T1: backend board.config.ts
- [x] Implementar T2: backend board.config.spec.ts
- [x] Implementar T3: frontend board-data.ts
- [x] Implementar T4: frontend board-layout.ts
- [x] Implementar T5: frontend turn-logic.ts
- [x] Implementar T6: frontend BoardRenderer.ts
- [x] Especificar BOARD-RULES: Regras do Tabuleiro
- [x] Design BOARD-RULES: Regras do Tabuleiro
- [x] Tasks BOARD-RULES: Regras do Tabuleiro
- [x] Implementar T1: backend board.config.ts (spoke categories + hub guard + ring-spoke extension)
- [x] Implementar T2: backend game.service.ts (canAccessHub param + mustLeaveHub bug fix)
- [x] Implementar T3: backend board.config.spec.ts (tests for BR-1, BR-2, BR-3)
- [x] Implementar T4: frontend board-data.ts (spoke categories)
- [x] Implementar T5: frontend turn-logic.ts (hub guard + ring-spoke extension)
- [x] Implementar T6: frontend GamePage.tsx (canAccessHub param)
- [x] Especificar SPOKE-NAV-RULES: Regras de navegação por diâmetro
- [x] Design SPOKE-NAV-RULES: Regras de navegação por diâmetro
- [x] Tasks SPOKE-NAV-RULES: Regras de navegação por diâmetro
- [ ] Implementar T1: backend board.config.ts (spoke overshoot → raio oposto)
- [ ] Implementar T2: frontend turn-logic.ts (espelhar overshoot → raio oposto)
- [ ] Implementar T3: backend board.config.spec.ts (testes SDN-01 + SDN-02/03 verificação)

---

## Preferences

**Model Guidance Shown:** never
