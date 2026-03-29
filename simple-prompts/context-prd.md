# Contexto do Projeto — Trivia Pursuit (Versão Digital)

## Descrição do Projeto

Jogo de tabuleiro digital baseado no **Trivial Pursuit** clássico (Genus Edition). O jogador percorre um tabuleiro circular respondendo perguntas de trivia em 6 categorias, coletando fatias de torta (wedges) e buscando a vitória no desafio final no hub central.

> **Referência completa de mecânicas do jogo:** consulte o arquivo `references/game-doc.md` para regras detalhadas, fluxo de turno, estados do jogo e condições de vitória.

### Resumo das Mecânicas Principais

- **Tabuleiro circular** com 6 raios (spokes), hub central, casas coloridas, casas HQ (fatia) e casas Roll Again.
- **6 categorias:** Geografia (azul), Entretenimento (rosa), História (amarelo), Arte e Literatura (marrom), Ciências e Natureza (verde), Esportes e Lazer (laranja).
- **Fluxo de turno:** rolar dado d6 → mover peça → responder pergunta da cor da casa → acertar = joga novamente / errar = passa a vez.
- **Fatias:** conquistadas ao acertar em casas HQ. Coletar as 6 fatias + acertar o desafio final no hub central = vitória.
- **2 a 6 jogadores**, turnos em sentido horário, sem mecanismo de empate.

---

## Tech Stack

### Frontend

- **React** — UI e gerenciamento de estado
- **Tailwind CSS** — estilização utilitária
- **Axios** — requisições HTTP ao backend
- **PixiJS** — engine de renderização do tabuleiro e animações do jogo
- **Jest** — testes unitários e de integração

### Backend

- **NestJS** — framework para API REST
- **Jest** — testes unitários e de integração
- **JWT** — autenticação stateless por token

---

## Regras de Armazenamento de Dados

- **Não haverá banco de dados.** As perguntas serão armazenadas em arquivo(s) JSON estático(s) no backend.
- **Mínimo:** ao menos 1 pergunta por categoria (6 perguntas no total).
- **Estrutura JSON por pergunta:**

```json
{
  "id": "string | number",
  "category": "geography | entertainment | history | art | science | sports",
  "question": "string",
  "answers": [
    { "id": "string | number", "text": "string" },
    { "id": "string | number", "text": "string" },
    { "id": "string | number", "text": "string" },
    { "id": "string | number", "text": "string" }
  ],
  "correctAnswer": "string | number (referência ao id da answer correta)"
}
```

---

## Telas da Aplicação

### Tela 1 — Login

- **Componentes:** um campo de input para apelido (nickname) + botão de entrar.
- **Comportamento:** ao submeter, o backend gera e retorna um JWT. O frontend armazena o token e redireciona o usuário para a Tela 2.
- **Validação:** o apelido não pode ser vazio.

### Tela 2 — Iniciar Jogo

- **Componentes:** um botão centralizado "Iniciar Jogo".
- **Comportamento:** ao clicar, o usuário é redirecionado para a Tela 3 (Tabuleiro). O backend inicializa o estado do jogo.

### Tela 3 — Tabuleiro (Jogo Principal)

- **Ao entrar:** o jogador escolhe uma peça/cor para representá-lo. Após a escolha, o jogo inicia.
- **Comportamento:** toda a mecânica do jogo descrita em `references/game-doc.md` ocorre nesta tela — rolagem de dado, movimentação, perguntas, coleta de fatias, desafio final e tela de vitória.
- **Renderização:** o tabuleiro e as animações devem ser renderizados com PixiJS.

### Layout do Tabuleiro

- O tabuleiro segue o formato circular clássico do Trivial Pursuit: hub central hexagonal, 6 raios coloridos levando às casas HQ, e uma trilha circular externa com casas coloridas alternadas e casas Roll Again.
- Referência visual: consulte `references/trivia-pursuit-tabuleiro.jpg` (se disponível) para o layout esperado.

---

## Restrições e Premissas

- O projeto é voltado para **fins de estudo**, sem necessidade de deploy em produção.
- Suporte a **apenas 1 jogador humano** por sessão (os demais podem ser controlados por lógica simplificada ou turnos simulados, a definir no PRD).
- Não há integração com APIs externas de perguntas; tudo é local via JSON.
- A autenticação JWT serve apenas para proteger as rotas do backend durante a sessão de jogo.
