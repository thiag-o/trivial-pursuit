# State

**Last Updated:** 2026-03-29
**Current Work:** MVP-3: Tabuleiro PixiJS — tasks

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
- [ ] Tasks MVP-3: Tabuleiro PixiJS
- [ ] Implementar MVP-3: Tabuleiro PixiJS

---

## Preferences

**Model Guidance Shown:** never
