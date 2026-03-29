# MVP-1: Backend Base — Tasks

**Design**: `.specs/features/mvp-1-backend-base/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Project Scaffold + Shared Types (Sequential)

Bootstrap do projeto NestJS e definições compartilhadas. Tudo depende disso.

```
T1 → T2 → T3 → T4
```

### Phase 2: Auth Module (Sequential)

Módulo de autenticação completo — pré-requisito para testar qualquer outro módulo.

```
T5 → T6 → T7 → T8 → T9
```

### Phase 3: Game + Questions Core (Parallel OK)

Stores e serviços core. Podem ser construídos em paralelo após Auth.

```
         ┌→ T10 → T11 → T12 ─┐
T9 done ─┤                    ├──→ Phase 4
         └→ T13 → T14 → T15 ─┘
```

### Phase 4: Controllers + Integration (Sequential)

Montagem dos controllers e integração entre módulos.

```
T16 → T17 → T18 → T19
```

### Phase 5: Smoke Test End-to-End (Sequential)

Validação final do fluxo completo.

```
T20
```

---

## Task Breakdown

### T1: Scaffold NestJS Project

**What**: Inicializar projeto NestJS com dependências do MVP-1
**Where**: `/` (raiz do projeto)
**Depends on**: None
**Requirement**: —

**Steps**:

1. `nest new backend --package-manager npm --skip-git` (ou equivalente manual)
2. Instalar dependências: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/config`, `class-validator`, `class-transformer`, `uuid`
3. Instalar devDependencies: `@types/passport-jwt`, `@types/uuid`
4. Criar `.env` com `JWT_SECRET`, `CORS_ORIGIN`, `PORT`
5. Criar `.env.example` com as mesmas variáveis sem valores sensíveis

**Done when**:

- [ ] `npm run start:dev` inicia sem erros na porta 3001
- [ ] Dependências listadas no package.json
- [ ] `.env` e `.env.example` existem

**Verify**:

```bash
cd backend && npm run start:dev
# Deve iniciar sem erros em http://localhost:3001
```

**Commit**: `chore: scaffold NestJS project with dependencies`

---

### T2: Configure App Module (CORS, ValidationPipe, ConfigModule)

**What**: Configurar bootstrap do app — CORS, ValidationPipe global, ConfigModule
**Where**: `src/main.ts`, `src/app.module.ts`
**Depends on**: T1
**Requirement**: AUTH-05, VAL-02

**Steps**:

1. Configurar `ConfigModule.forRoot({ isGlobal: true })` no AppModule
2. Configurar CORS em `main.ts` com origin de `CORS_ORIGIN` env
3. Adicionar `ValidationPipe` global com `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
4. Configurar porta via `PORT` env (default 3001)

**Done when**:

- [ ] App inicia com CORS habilitado para a origem configurada
- [ ] ValidationPipe global ativo (payloads inválidos retornam 400)
- [ ] ConfigService acessível em qualquer módulo

**Verify**:

```bash
curl -X POST http://localhost:3001/any-route -H "Content-Type: application/json" -d '{"invalid": true}'
# Deve retornar alguma resposta (não crash)
```

**Commit**: `feat(config): add CORS, ValidationPipe, and ConfigModule`

---

### T3: Create Shared Enums and Interfaces

**What**: Criar os enums e interfaces compartilhados definidos no design
**Where**: `src/common/interfaces/`
**Depends on**: T1
**Requirement**: —

**Steps**:

1. Criar `src/common/enums/category.enum.ts` — enum Category (6 categorias)
2. Criar `src/common/enums/tile-type.enum.ts` — enum TileType (category, hq, rollAgain, hub)
3. Criar `src/common/enums/turn-phase.enum.ts` — enum TurnPhase (waitingRoll, waitingMove, waitingAnswer)
4. Criar `src/common/enums/game-status.enum.ts` — enum GameStatus (started, finished)
5. Criar `src/common/interfaces/player.interface.ts` — interface Player
6. Criar `src/common/interfaces/game-state.interface.ts` — interface GameState
7. Criar `src/common/interfaces/tile.interface.ts` — interface Tile
8. Criar `src/common/interfaces/question.interface.ts` — interfaces Question, Answer
9. Criar barrel exports: `src/common/enums/index.ts`, `src/common/interfaces/index.ts`

**Done when**:

- [ ] Todos os enums e interfaces exportados corretamente
- [ ] Sem erros de TypeScript (`npx tsc --noEmit`)
- [ ] Imports funcionam via barrel: `import { Category, Player } from '../common/enums'`

**Verify**:

```bash
npx tsc --noEmit
# Zero errors
```

**Commit**: `feat(common): add shared enums and interfaces`

---

### T4: Create Board Configuration

**What**: Definição estática do tabuleiro — tiles, tipos, categorias, destinos válidos
**Where**: `src/game/board.config.ts`
**Depends on**: T3
**Requirement**: GAME-05, GAME-06

**Steps**:

1. Criar array de 73 Tiles (posição 0-72) com tipo e categoria conforme layout do design
2. Implementar `getTile(position)` — retorna tile por posição
3. Implementar `getValidDestinations(from, diceValue)` — calcula destinos no anel circular (simplificado MVP-1)
4. Implementar `isValidPosition(position)` — valida range 0-72
5. Exportar como injectable NestJS (`@Injectable()`)

**Done when**:

- [ ] 73 tiles definidos com tipos corretos (hub, category, hq, rollAgain)
- [ ] 6 HQs nas posições 5, 10, 15, 20, 25, 30 com categoria correta
- [ ] 12 casas rollAgain na trilha circular
- [ ] `getValidDestinations(31, 3)` retorna posições a 3 passos no anel
- [ ] Sem erros de TypeScript

**Verify**:

```bash
npx tsc --noEmit
# Manual: instanciar e testar getTile(0).type === 'hub', getTile(5).type === 'hq'
```

**Commit**: `feat(game): add board configuration with tile definitions`

---

### T5: Create Auth Decorators (@Public, @CurrentUser)

**What**: Decorators customizados para bypass de auth e extração de usuário
**Where**: `src/auth/decorators/`
**Depends on**: T2
**Requirement**: AUTH-04

**Steps**:

1. Criar `src/auth/decorators/public.decorator.ts` — `@Public()` usando `SetMetadata('isPublic', true)`
2. Criar `src/auth/decorators/current-user.decorator.ts` — `@CurrentUser()` que extrai `request.user.nickname`
3. Criar barrel export `src/auth/decorators/index.ts`

**Done when**:

- [ ] `@Public()` seta metadata 'isPublic' = true
- [ ] `@CurrentUser()` retorna string do nickname
- [ ] Barrel export funciona

**Verify**:

```bash
npx tsc --noEmit
```

**Commit**: `feat(auth): add @Public and @CurrentUser decorators`

---

### T6: Create Login DTO

**What**: DTO de login com validação de nickname
**Where**: `src/auth/dto/login.dto.ts`
**Depends on**: T2
**Requirement**: VAL-01

**Steps**:

1. Criar `LoginDto` com campo `nickname: string`
2. Adicionar validadores: `@IsNotEmpty()`, `@IsString()`, `@MaxLength(30)`
3. Adicionar `@Matches(/\S/)` para rejeitar strings só com espaços

**Done when**:

- [ ] `nickname: ""` → erro de validação
- [ ] `nickname: "   "` → erro de validação
- [ ] `nickname: "A".repeat(31)` → erro de validação
- [ ] `nickname: "Thiago"` → passa validação

**Verify**:

```bash
npx tsc --noEmit
```

**Commit**: `feat(auth): add LoginDto with nickname validation`

---

### T7: Create JWT Strategy

**What**: Passport strategy para validar JWT do header Authorization
**Where**: `src/auth/strategies/jwt.strategy.ts`
**Depends on**: T5
**Requirement**: AUTH-03

**Steps**:

1. Criar `JwtStrategy` estendendo `PassportStrategy(Strategy)`
2. Configurar `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`
3. Configurar `secretOrKey` via `ConfigService.get('JWT_SECRET')`
4. Implementar `validate(payload)` retornando `{ nickname: payload.nickname }`

**Done when**:

- [ ] Strategy registrada e injetável
- [ ] Extrai JWT do header `Authorization: Bearer <token>`
- [ ] Retorna `{ nickname }` do payload
- [ ] Sem erros de TypeScript

**Verify**:

```bash
npx tsc --noEmit
```

**Commit**: `feat(auth): add JWT passport strategy`

---

### T8: Create JWT Auth Guard (Global)

**What**: Guard global que protege todas as rotas, com bypass para `@Public()`
**Where**: `src/auth/guards/jwt-auth.guard.ts`
**Depends on**: T5, T7
**Requirement**: AUTH-04, AUTH-05

**Steps**:

1. Criar `JwtAuthGuard` estendendo `AuthGuard('jwt')`
2. Override `canActivate()` para checar metadata `isPublic` via Reflector
3. Se `isPublic === true`, retorna `true` (bypass)
4. Caso contrário, delega para `super.canActivate(context)`
5. Registrar como `APP_GUARD` no AuthModule

**Done when**:

- [ ] Rotas sem `@Public()` retornam 401 sem token
- [ ] Rotas com `@Public()` passam sem token
- [ ] Guard registrado globalmente via APP_GUARD

**Verify**:

```bash
# Após T9 (AuthController):
curl http://localhost:3001/auth/login -X POST -H "Content-Type: application/json" -d '{"nickname":"Test"}'
# Deve funcionar (rota @Public)
```

**Commit**: `feat(auth): add global JWT guard with @Public bypass`

---

### T9: Create AuthModule (Controller + Service)

**What**: AuthController (POST /auth/login) + AuthService (geração JWT) + módulo completo
**Where**: `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/auth.module.ts`
**Depends on**: T6, T7, T8
**Requirement**: AUTH-01, AUTH-02

**Steps**:

1. Criar `AuthService` com método `login(nickname: string): { token: string }`
   - Usa `JwtService.sign({ nickname }, { expiresIn: '2h' })`
2. Criar `AuthController` com `@Public()` no endpoint
   - `@Post('login')` recebe `LoginDto`, retorna `{ token }` com HTTP 201
3. Criar `AuthModule` importando:
   - `JwtModule.registerAsync()` com secret do ConfigService e `expiresIn: '2h'`
   - `PassportModule`
   - Providers: AuthService, JwtStrategy, `{ provide: APP_GUARD, useClass: JwtAuthGuard }`
4. Importar `AuthModule` no `AppModule`

**Done when**:

- [ ] `POST /auth/login {"nickname":"Test"}` → 201 + `{ token: "..." }`
- [ ] `POST /auth/login {"nickname":""}` → 400
- [ ] Token decodificado contém `nickname` e `exp`
- [ ] Qualquer outra rota sem token → 401

**Verify**:

```bash
# Login funcional:
curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"nickname":"Test"}' | jq .
# → { "token": "eyJ..." }

# Rota inexistente sem token:
curl -s http://localhost:3001/game/start
# → 401
```

**Commit**: `feat(auth): add AuthModule with login endpoint and JWT generation`

---

### T10: Create GameStateStore

**What**: Store in-memory para estado de partidas (Maps)
**Where**: `src/game/game-state.store.ts`
**Depends on**: T3
**Requirement**: GAME-01, GAME-02

**Steps**:

1. Criar `@Injectable()` `GameStateStore`
2. `private games = new Map<string, GameState>()` (gameId → state)
3. `private playerGames = new Map<string, string>()` (nickname → gameId)
4. Implementar: `create()`, `findByGameId()`, `findByNickname()`, `update()`, `delete()`
5. `create()` também registra o mapeamento nickname → gameId para todos os jogadores

**Done when**:

- [ ] `create()` armazena GameState e mapeamentos de todos os players
- [ ] `findByNickname()` retorna o game correto
- [ ] `update()` substitui o state
- [ ] `delete()` limpa games + playerGames

**Verify**:

```bash
npx tsc --noEmit
```

**Commit**: `feat(game): add in-memory GameStateStore`

---

### T11: Create GameService

**What**: Lógica core de jogo — criação de partida, dado, movimentação, controle de turno
**Where**: `src/game/game.service.ts`
**Depends on**: T4, T10
**Requirement**: GAME-01 a GAME-06

**Steps**:

1. Criar `@Injectable()` `GameService` com inject de `GameStateStore` e `BoardConfig`
2. `startGame(nickname, opponents)`:
   - Valida que não há jogo ativo para o nickname
   - Cria GameState com UUID, players (1 humano + N bots), currentPlayerIndex=0, status=started, turnPhase=waitingRoll
   - Bots nomeados "Bot 1", "Bot 2", etc.
   - Salva no store
3. `rollDice(nickname)`:
   - Busca game, valida turno do jogador e turnPhase=waitingRoll
   - Gera random 1-6 (`Math.floor(Math.random() * 6) + 1`)
   - Atualiza lastDiceRoll e turnPhase=waitingMove
4. `move(nickname, targetPosition)`:
   - Busca game, valida turnPhase=waitingMove
   - Valida targetPosition via `BoardConfig.getValidDestinations()`
   - Atualiza posição do player
   - Avalia tipo da casa: rollAgain → turnPhase=waitingRoll; categoria/hq/hub → turnPhase=waitingAnswer
5. `processAnswer(gameId, correct)`:
   - Se correto + HQ + não tem wedge → adiciona wedge
   - Se correto → turnPhase=waitingRoll (joga de novo)
   - Se incorreto → avança currentPlayerIndex (próximo jogador), turnPhase=waitingRoll

**Done when**:

- [ ] `startGame()` cria partida com estrutura correta
- [ ] `rollDice()` retorna 1-6 e valida turno
- [ ] `move()` valida posição e atualiza game state
- [ ] `processAnswer()` gerencia wedges e transição de turno
- [ ] Erros de negócio lançam `BadRequestException` com mensagens da Error Handling Strategy

**Verify**:

```bash
npx tsc --noEmit
```

**Commit**: `feat(game): add GameService with game logic`

---

### T12: Create Game DTOs

**What**: DTOs de request para endpoints de jogo
**Where**: `src/game/dto/`
**Depends on**: T2
**Requirement**: GAME-01, GAME-05, VAL-02

**Steps**:

1. Criar `StartGameDto` com `opponents?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(5)`, default 3
2. Criar `MoveDto` com `targetPosition: number` — `@IsInt()`
3. Criar barrel export `src/game/dto/index.ts`

**Done when**:

- [ ] `{ opponents: 0 }` → erro de validação
- [ ] `{ opponents: 6 }` → erro de validação
- [ ] `{}` → aceita com default 3
- [ ] `{ targetPosition: "abc" }` → erro de validação

**Verify**:

```bash
npx tsc --noEmit
```

**Commit**: `feat(game): add StartGameDto and MoveDto`

---

### T13: Create QuestionsStore

**What**: Pool de perguntas em memória carregado do JSON + tracking de usadas
**Where**: `src/questions/questions.store.ts`
**Depends on**: T3
**Requirement**: QUEST-02

**Steps**:

1. Criar `@Injectable()` `QuestionsStore`
2. `private questions: Question[]` — carregadas do JSON
3. `private usedQuestions = new Map<string, Set<string>>()` — chave: `gameId:nickname`
4. `loadFromJson()` — chamado no `onModuleInit()`, lê `./data/questions.json`
5. `getByCategory(category)` — filtra por categoria
6. `getById(id)` — busca por ID
7. `markAsUsed(gameId, nickname, questionId)` — adiciona ao set
8. `getUsedIds(gameId, nickname)` — retorna set de IDs usados
9. `resetCategoryPool(gameId, nickname, category)` — remove IDs daquela categoria do set de usados

**Done when**:

- [ ] JSON carregado no startup
- [ ] Filtragem por categoria funciona
- [ ] Tracking de usadas isola por gameId+nickname
- [ ] Reset por categoria funciona

**Verify**:

```bash
npx tsc --noEmit
```

**Commit**: `feat(questions): add QuestionsStore with JSON loading and usage tracking`

---

### T14: Create Questions JSON Data

**What**: Arquivo JSON estático com perguntas (mín. 2 por categoria = 12 total)
**Where**: `src/questions/data/questions.json`
**Depends on**: None
**Requirement**: QUEST-01

**Steps**:

1. Criar `questions.json` com array de objetos Question
2. Mínimo 2 perguntas por categoria (12 total) — permite testar reset de pool
3. Cada pergunta: `{ id, category, question, answers: [{id, text}×4], correctAnswer }`
4. IDs no formato: `geo-001`, `ent-001`, `his-001`, `art-001`, `sci-001`, `spo-001`

**Done when**:

- [ ] 6 categorias com ≥ 2 perguntas cada
- [ ] Todas as perguntas têm 4 alternativas (a, b, c, d)
- [ ] Cada pergunta tem `correctAnswer` válido
- [ ] JSON é válido (parseable)

**Verify**:

```bash
node -e "const q = require('./src/questions/data/questions.json'); console.log(q.length, 'questions loaded')"
```

**Commit**: `feat(questions): add static questions JSON data`

---

### T15: Create QuestionsService

**What**: Lógica de busca por categoria, seleção não-repetida, verificação de resposta
**Where**: `src/questions/questions.service.ts`
**Depends on**: T13, T14
**Requirement**: QUEST-01 a QUEST-04

**Steps**:

1. Criar `@Injectable()` `QuestionsService` com inject de `QuestionsStore`
2. `getByCategory(category, nickname, gameId)`:
   - Valida categoria
   - Busca perguntas da categoria, filtra usadas
   - Se todas usadas, reseta pool da categoria e busca novamente
   - Seleciona aleatória, marca como usada
   - Retorna SEM `correctAnswer`
3. `checkAnswer(questionId, answerId)`:
   - Busca pergunta por ID, valida existência
   - Compara answerId com correctAnswer
   - Retorna `{ correct, correctAnswer }`
4. `getValidCategories()` — retorna array de Category enum values

**Done when**:

- [ ] `getByCategory("geography", ...)` retorna pergunta sem `correctAnswer`
- [ ] Pergunta não repetida na mesma sessão de jogo
- [ ] Pool reseta quando esgota
- [ ] `checkAnswer()` retorna resultado correto
- [ ] Categoria inválida → `BadRequestException`
- [ ] ID inválido → `NotFoundException`

**Verify**:

```bash
npx tsc --noEmit
```

**Commit**: `feat(questions): add QuestionsService with category search and answer verification`

---

### T16: Create GameController + GameModule

**What**: Controller REST com 3 endpoints de jogo + módulo completo
**Where**: `src/game/game.controller.ts`, `src/game/game.module.ts`
**Depends on**: T11, T12
**Requirement**: GAME-01, GAME-03, GAME-05

**Steps**:

1. Criar `GameController` com prefix `'game'`
   - `@Post('start')` — recebe `StartGameDto`, `@CurrentUser()`, retorna GameStateResponse
   - `@Post('roll-dice')` — recebe `@CurrentUser()`, retorna DiceRollResponse
   - `@Post('move')` — recebe `MoveDto`, `@CurrentUser()`, retorna MoveResponse
2. Criar `GameModule` com providers: GameService, GameStateStore, BoardConfig
3. Exportar `GameService` (usado pelo QuestionsModule)
4. Importar `GameModule` no `AppModule`

**Done when**:

- [ ] `POST /game/start` com token → cria jogo e retorna state
- [ ] `POST /game/roll-dice` com token → retorna dado 1-6
- [ ] `POST /game/move` com token → atualiza posição e retorna state
- [ ] Todas as rotas retornam 401 sem token

**Verify**:

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"nickname":"Test"}' | jq -r .token)

curl -s -X POST http://localhost:3001/game/start -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | jq .
# → { gameId, players, currentPlayer, status: "started", ... }

curl -s -X POST http://localhost:3001/game/roll-dice -H "Authorization: Bearer $TOKEN" | jq .
# → { value: 1-6 }
```

**Commit**: `feat(game): add GameController with start, roll-dice, and move endpoints`

---

### T17: Create QuestionsController + QuestionsModule

**What**: Controller REST com 2 endpoints de perguntas + módulo completo
**Where**: `src/questions/questions.controller.ts`, `src/questions/questions.module.ts`
**Depends on**: T15, T16
**Requirement**: QUEST-01, QUEST-03

**Steps**:

1. Criar `AnswerDto` com `answerId: string` — `@IsIn(['a', 'b', 'c', 'd'])`
2. Criar `QuestionsController` com prefix `'questions'`
   - `@Get(':category')` — recebe category param, `@CurrentUser()`, retorna QuestionResponse
   - `@Post(':id/answer')` — recebe id param, `AnswerDto`, `@CurrentUser()`, retorna AnswerResultResponse
3. No endpoint de answer: chamar `QuestionsService.checkAnswer()` + `GameService.processAnswer()`
4. Criar `QuestionsModule` importando `GameModule`, providers: QuestionsService, QuestionsStore
5. Importar `QuestionsModule` no `AppModule`

**Done when**:

- [ ] `GET /questions/geography` com token → retorna pergunta sem correctAnswer
- [ ] `GET /questions/invalid` com token → 400 com categorias válidas
- [ ] `POST /questions/:id/answer {"answerId":"a"}` → retorna correct/incorrect
- [ ] `POST /questions/:id/answer {"answerId":"x"}` → 400

**Verify**:

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"nickname":"Test"}' | jq -r .token)

curl -s http://localhost:3001/questions/geography -H "Authorization: Bearer $TOKEN" | jq .
# → { id, category, question, answers[] } sem correctAnswer
```

**Commit**: `feat(questions): add QuestionsController with category search and answer endpoints`

---

### T18: Wire Integration Game ↔ Questions (activeQuestionId)

**What**: Integrar o fluxo completo — Questions seta activeQuestionId no GameState, answer atualiza turno
**Where**: `src/questions/questions.controller.ts`, `src/game/game.service.ts` (modificações)
**Depends on**: T16, T17
**Requirement**: QUEST-04, GAME-06

**Steps**:

1. No `QuestionsController.getByCategory()`:
   - Buscar game ativo do jogador via GameService
   - Validar que `turnPhase === waitingAnswer`
   - Após obter pergunta, atualizar `activeQuestionId` no game state
2. No `QuestionsController.answer()`:
   - Validar que `questionId` === `game.activeQuestionId`
   - Após checkAnswer, chamar `GameService.processAnswer(gameId, correct)`
   - Se correto em HQ → adicionar wedge
   - Limpar `activeQuestionId`
3. Retornar game state atualizado junto com resultado da resposta

**Done when**:

- [ ] GET /questions/:category seta activeQuestionId no game state
- [ ] POST /questions/:id/answer só aceita a pergunta ativa
- [ ] Resposta correta em HQ adiciona wedge
- [ ] Resposta correta → turnPhase = waitingRoll
- [ ] Resposta incorreta → próximo jogador

**Verify**:

```bash
# Fluxo completo:
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"nickname":"Test"}' | jq -r .token)
curl -s -X POST http://localhost:3001/game/start -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | jq .
curl -s -X POST http://localhost:3001/game/roll-dice -H "Authorization: Bearer $TOKEN" | jq .
curl -s -X POST http://localhost:3001/game/move -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"targetPosition":32}' | jq .
curl -s http://localhost:3001/questions/geography -H "Authorization: Bearer $TOKEN" | jq .
# Usar o question ID retornado:
curl -s -X POST http://localhost:3001/questions/geo-001/answer -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"answerId":"a"}' | jq .
```

**Commit**: `feat(integration): wire Game ↔ Questions with activeQuestionId flow`

---

### T19: Add Edge Case Handling

**What**: Implementar edge cases definidos na spec
**Where**: `src/game/game.service.ts`, `src/questions/questions.service.ts` (modificações)
**Depends on**: T18
**Requirement**: Edge Cases da spec

**Steps**:

1. GameService — `startGame()`: se jogador já tem jogo ativo → `BadRequestException("Game already in progress")`
2. GameService — `move()`: se tile é rollAgain → manter atual jogador, turnPhase=waitingRoll (não precisa responder)
3. QuestionsService — `getByCategory()`: se todas perguntas da categoria usadas → resetar pool
4. QuestionsController — `answer()`: se questionId ≠ activeQuestionId → `BadRequestException("This question is not currently active")`

**Done when**:

- [ ] Segundo `POST /game/start` com jogo ativo → 400
- [ ] Casa rollAgain → turnPhase volta para waitingRoll sem pergunta
- [ ] Pool esgotado → reseta e retorna pergunta
- [ ] Pergunta inativa → 400

**Verify**:

```bash
# Testar jogo duplicado:
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"nickname":"Test"}' | jq -r .token)
curl -s -X POST http://localhost:3001/game/start -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | jq .
curl -s -X POST http://localhost:3001/game/start -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | jq .
# → Segunda resposta deve ser 400 "Game already in progress"
```

**Commit**: `feat(game): add edge case handling for duplicate games, rollAgain, pool reset`

---

### T20: End-to-End Smoke Test

**What**: Validar fluxo completo via curl: login → start → roll → move → question → answer
**Where**: — (apenas teste manual, sem alteração de código)
**Depends on**: T19
**Requirement**: Success Criteria da spec

**Steps**:

1. Login → obter token
2. Start game → verificar players, status
3. Roll dice → verificar value 1-6
4. Move → verificar posição e tileType
5. Get question → verificar formato, ausência de correctAnswer
6. Answer → verificar correct/incorrect e game state atualizado
7. Testar 401 sem token em todas as rotas
8. Testar validações (nickname vazio, opponents inválido, etc.)

**Done when**:

- [ ] Fluxo completo login → start → roll → move → question → answer funciona sem erros
- [ ] Todas as rotas (exceto login) retornam 401 sem token
- [ ] 6 categorias com ≥ 2 perguntas cada no JSON
- [ ] Respostas da API em ≤ 200ms
- [ ] Validações retornam 400 com mensagens descritivas

**Verify**:

```bash
# Script de smoke test completo:
echo "=== Login ==="
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"nickname":"Thiago"}' | jq -r .token)
echo "Token: ${TOKEN:0:20}..."

echo "=== Start Game ==="
curl -s -X POST http://localhost:3001/game/start -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | jq .

echo "=== Roll Dice ==="
curl -s -X POST http://localhost:3001/game/roll-dice -H "Authorization: Bearer $TOKEN" | jq .

echo "=== 401 without token ==="
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3001/game/roll-dice

echo "=== Invalid login ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"nickname":""}'
```

**Commit**: — (sem commit, apenas validação)

---

## Parallel Execution Map

```
Phase 1 (Sequential — Scaffold):
  T1 → T2 → T3 → T4

Phase 2 (Sequential — Auth):
  T5 → T6 → T7 → T8 → T9

Phase 3 (Parallel — Stores & Services):
  ┌→ T10 → T11 (Game)     ┐
  ├→ T12 (Game DTOs) [P]   ├→ Phase 4
  ├→ T13 → T15 (Questions) │
  └→ T14 (JSON data) [P]  ┘

Phase 4 (Sequential — Controllers):
  T16 → T17 → T18 → T19

Phase 5 (Validation):
  T20
```

---

## Task Granularity Check

| Task | Scope                      | Status                               |
| ---- | -------------------------- | ------------------------------------ |
| T1   | 1 scaffold operation       | ✅ Granular                          |
| T2   | 2 config files             | ✅ Granular                          |
| T3   | Enums + interfaces         | ⚠️ OK (cohesive types in one commit) |
| T4   | 1 service file             | ✅ Granular                          |
| T5   | 2 decorators               | ✅ Granular                          |
| T6   | 1 DTO file                 | ✅ Granular                          |
| T7   | 1 strategy file            | ✅ Granular                          |
| T8   | 1 guard file               | ✅ Granular                          |
| T9   | Controller+Service+Module  | ⚠️ OK (module only works as unit)    |
| T10  | 1 store file               | ✅ Granular                          |
| T11  | 1 service file             | ✅ Granular                          |
| T12  | 2 DTO files                | ✅ Granular                          |
| T13  | 1 store file               | ✅ Granular                          |
| T14  | 1 JSON data file           | ✅ Granular                          |
| T15  | 1 service file             | ✅ Granular                          |
| T16  | Controller+Module          | ⚠️ OK (module only works as unit)    |
| T17  | Controller+Module+DTO      | ⚠️ OK (module only works as unit)    |
| T18  | Integration wiring         | ✅ Granular                          |
| T19  | Edge cases (modifications) | ✅ Granular                          |
| T20  | Validation only            | ✅ Granular                          |

---

## Requirement → Task Traceability

| Req ID   | Task(s)           | Status  |
| -------- | ----------------- | ------- |
| AUTH-01  | T9                | Planned |
| AUTH-02  | T9                | Planned |
| AUTH-03  | T7                | Planned |
| AUTH-04  | T5, T8            | Planned |
| AUTH-05  | T2, T8            | Planned |
| GAME-01  | T10, T11, T16     | Planned |
| GAME-02  | T10, T11          | Planned |
| GAME-03  | T11, T16          | Planned |
| GAME-04  | T11               | Planned |
| GAME-05  | T4, T11, T12, T16 | Planned |
| GAME-06  | T4, T11           | Planned |
| QUEST-01 | T14, T15, T17     | Planned |
| QUEST-02 | T13, T15          | Planned |
| QUEST-03 | T15, T17          | Planned |
| QUEST-04 | T15, T18          | Planned |
| VAL-01   | T6                | Planned |
| VAL-02   | T2, T12           | Planned |

**Coverage:** 17/17 requirements mapped to tasks ✅
