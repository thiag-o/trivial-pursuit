# Roadmap

**Current Milestone:** MVP — Partida Jogável de Ponta a Ponta
**Status:** Planning

---

## MVP — Partida Jogável de Ponta a Ponta

**Goal:** Uma partida completa funcional: login → tabuleiro → vitória/derrota
**Target:** Todas as funcionalidades Must Have implementadas e verificadas

### Features

**MVP-1: Backend Base** — COMPLETE

- AuthModule: endpoint POST /auth/login, geração/validação JWT
- QuestionsModule: JSON estático, GET /questions/:category, POST /questions/:id/answer
- GameModule: estado em memória, POST /game/start, POST /game/roll-dice, POST /game/move
- JWT guard protegendo todas as rotas (exceto login)
- CORS configurado para origem do frontend

**MVP-2: Frontend Base** — COMPLETE

- Tela de Login (campo apelido, validação, POST /auth/login, armazenamento JWT)
- Tela de Iniciar Jogo (botão centralizado, POST /game/start)
- React Router com 3 rotas: /login, /start, /game
- Axios com interceptor JWT
- Redirect para login em caso de 401

**MVP-3: Tabuleiro PixiJS** — COMPLETE

- Renderização do tabuleiro circular (hub central hexagonal, 6 raios, trilha circular)
- Casas coloridas por categoria, 6 casas HQ, 12 casas Roll Again
- Tokens dos jogadores posicionados no hub central
- Seleção de peça/cor pelo jogador

**MVP-8: Redesenho do Tabuleiro** — COMPLETE

- Anel reduzido de 72 para 42 tiles
- HQs reposicionadas uniformemente: posições 7, 14, 21, 28, 35, 42 (uma por categoria a cada 7 tiles)
- 6 raios com 5 spoke tiles navegáveis cada (posições 43–72), conectando HQ ao hub
- Movimento spoke-aware: hub → spoke, spoke → anel, HQ → spoke, ring wrap ajustado
- Backend e frontend sincronizados com nova topologia
- Remoção dos 12 tiles Roll Again

**MVP-9: Regras do Tabuleiro** — COMPLETE

- Spoke tiles com categorias variadas: padrão rotacional `CATEGORY_CYCLE[(S+T+1)%6]` — cada raio tem os 5 tiles em categorias diferentes (não mais todos iguais à HQ)
- Hub central bloqueado até o jogador ter 6 fatias (canAccessHub = wedges===6 && !mustLeaveHub)
- Extensão de movimento raio→anel: quando dado ultrapassa a HQ no raio, os passos restantes continuam no anel (forward e backward)
- Extensão de movimento anel→raio: quando jogador passa por uma HQ no anel sem parar, pode escolher entrar no raio com os passos restantes
- Correção de bug: mustLeaveHub resetado corretamente após sair do hub

**MVP-4: Lógica de Turno** — COMPLETE

- Rolagem de dado d6 com animação e resultado do backend
- Cálculo de destinos válidos (grafo de adjacência: circular + raios + hub)
- Destaque visual das casas válidas + seleção pelo jogador
- Movimentação da peça até destino
- Avaliação do tipo de casa (colorida, HQ, Roll Again, Hub Central)
- Modal de pergunta com 4 alternativas, feedback acerto/erro

**MVP-5: Fatias e Vitória** — COMPLETE

- Conquista de fatia ao acertar em casa HQ (sem duplicata)
- Hub Central sem 6 fatias: escolha de categoria
- Hub Central com 6 fatias: Desafio Final (categoria escolhida pelo sistema)
- Acerto no Desafio Final = vitória; erro = sai do hub
- Tela de vitória e tela de derrota

**MVP-6: Oponentes Simulados** — COMPLETE

- 1 a 5 oponentes com turnos automáticos
- Lógica simplificada: movimento aleatório + probabilidade fixa de acerto (~50%)
- Exibição breve das ações dos oponentes no tabuleiro
- Oponente pode vencer (Desafio Final) → tela de derrota para jogador humano

**MVP-7: Testes** — COMPLETE

- Testes unitários Jest: lógica de estado do jogo, validação de respostas (backend)
- Testes unitários Jest: componentes React críticos (login, modal de perguntas)
- Testes de integração: fluxo de autenticação (login → token → rota protegida → 401)
- Meta: ≥70% cobertura na lógica de estado do jogo

---

## Fase 2 — Melhorias Incrementais

**Goal:** Polish, conteúdo expandido e funcionalidades avançadas

### Features

**F2-1: Mais Perguntas** — PLANNED

- Expandir JSON para 20+ perguntas por categoria

**F2-2: Animações Avançadas** — PLANNED

- Física simulada no dado, movimentação suave, efeitos de conquista de fatia

**F2-3: Efeitos Sonoros** — PLANNED

- Sons de acerto, erro, rolagem, vitória

**F2-4: Timer de Resposta** — PLANNED

- Contagem regressiva configurável para responder perguntas

**F2-5: Responsividade** — PLANNED

- Suporte a tablets e resoluções menores

---

## Future Considerations

- Multiplayer real via WebSockets
- Banco de dados (PostgreSQL/MongoDB) para persistir partidas e rankings
- Integração com API externa de perguntas (OpenTDB)
- Edições temáticas alternativas
