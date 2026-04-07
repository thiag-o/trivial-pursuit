# Trivia Pursuit

Versão digital web do **Trivial Pursuit (Genus Edition)**. Um jogador humano enfrenta oponentes controlados pelo sistema em um tabuleiro circular, respondendo perguntas de 6 categorias para coletar fatias e vencer o desafio final.

Projeto de portfólio/estudo com stack fullstack moderna.

---

## Stack

| Camada      | Tecnologias                                         |
| ----------- | --------------------------------------------------- |
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS, PixiJS 8  |
| Backend     | NestJS 11, TypeScript, Passport JWT                 |
| Comunicação | REST + JWT (sem banco de dados — estado em memória) |

---

## Estrutura

```
trivia-pursuit/
├── backend/    # API NestJS (porta 3001)
└── frontend/   # SPA React/Vite (porta 5173)
```

---

## Pré-requisitos

- Node.js >= 18
- npm >= 9

---

## Como rodar

### 1. Backend

```bash
cd backend
npm install
npm run start:dev
```

A API sobe em `http://localhost:3001`.

Variáveis de ambiente (opcional — use um `.env` na pasta `backend/`):

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=seu_segredo_aqui
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

---

## Fluxo da aplicação

1. **Login** — o jogador digita um apelido; o backend devolve um JWT sem senha.
2. **Lobby** — o jogador configura a partida (número de oponentes, cores).
3. **Tabuleiro** — renderizado com PixiJS; cada turno o jogador rola o dado, move a peça e responde uma pergunta da categoria da casa em que parou.
4. **Fatias** — ao acertar em uma casa de categoria especial o jogador ganha uma fatia daquela cor.
5. **Desafio final** — com as 6 fatias, o jogador precisa ir ao centro e responder a pergunta escolhida pelos adversários.
6. **Vitória/Derrota** — tela com resultado e opção de reiniciar.

---

## Endpoints principais (backend)

| Método | Rota                | Descrição                          |
| ------ | ------------------- | ---------------------------------- |
| POST   | `/auth/login`       | Recebe `{ nickname }`, retorna JWT |
| POST   | `/game/start`       | Inicia nova partida                |
| GET    | `/game/state`       | Retorna estado atual da partida    |
| POST   | `/game/move`        | Executa movimento do jogador       |
| POST   | `/game/answer`      | Envia resposta e avança turno      |
| GET    | `/questions/random` | Pergunta aleatória por categoria   |

Todas as rotas (exceto `/auth/login`) exigem `Authorization: Bearer <token>`.

---

## Testes

```bash
# Backend — unitários
cd backend && npm test

# Backend — e2e
cd backend && npm run test:e2e
```

---

## Contexto do projeto

Desenvolvido como exercício de aprendizado e peça de portfólio.  
Documentação de produto em [`artefacts/prd.md`](artefacts/prd.md) e regras do jogo em [`references/game-doc.md`](references/game-doc.md).
