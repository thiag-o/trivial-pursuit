# Trivia Pursuit (Versão Digital)

**Vision:** Versão digital web do Trivial Pursuit (Genus Edition) — um jogador humano enfrenta oponentes controlados pelo sistema em partida de perguntas e respostas sobre 6 categorias, com tabuleiro circular renderizado em PixiJS.
**For:** Desenvolvedor-autor (portfólio), recrutadores/avaliadores técnicos, jogadores casuais.
**Solves:** Demonstração técnica fullstack (React + NestJS) com renderização 2D, autenticação JWT e lógica de estado complexa — em contexto lúdico. Uso local, sem deploy em produção.

## Goals

- **G1:** Demonstrar domínio de React, Tailwind CSS e PixiJS no frontend (portfólio)
- **G2:** Demonstrar domínio de NestJS e autenticação JWT no backend (portfólio)
- **G3:** Implementar lógica de jogo de tabuleiro com máquina de estados completa
- **G4:** Entregar partida jogável de ponta a ponta (login → vitória) sem erros bloqueantes

## Tech Stack

**Core:**

- Frontend: React + Tailwind CSS + PixiJS
- Backend: NestJS (Node.js ≥ 18)
- Auth: JWT (@nestjs/jwt / jsonwebtoken)
- HTTP Client: Axios

**Key dependencies:** React Router, Jest (testes), PixiJS (tabuleiro 2D), Tailwind CSS (estilização)

## Scope

**v1 (MVP) includes:**

- Login com apelido e geração de JWT
- Tela de iniciar jogo com criação de estado de partida
- Tabuleiro PixiJS circular (hub, raios, casas HQ, Roll Again, casas coloridas)
- Seleção de peça/cor, rolagem de dado, movimentação, perguntas por categoria
- Lógica de acerto/erro, fatias em casas HQ, desafio final no hub central
- Oponentes simulados (1-5) com turnos automáticos
- Perguntas em JSON estático (mín. 6, uma por categoria)
- Autenticação JWT protegendo todas as rotas (exceto login)
- Telas de vitória e derrota

**Explicitly out of scope:**

- Multiplayer real (múltiplos jogadores humanos)
- Banco de dados persistente
- APIs externas de perguntas
- Deploy em produção / CI/CD
- Modo equipes
- Edições temáticas alternativas
- Responsividade mobile completa

## Constraints

- **Storage:** Sem banco de dados — perguntas em JSON, estado do jogo em memória (perdido ao reiniciar servidor)
- **Players:** Apenas 1 jogador humano por sessão; demais são simulados
- **Environment:** Execução local apenas; Node.js ≥ 18 + npm
- **Browser:** Chrome/Firefox última versão, resolução mín. 1280×720, requer WebGL
