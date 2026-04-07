# Spoke Diameter Navigation Rules — Specification

**Feature ID:** SPOKE-NAV-RULES
**Created:** 2026-03-30
**Status:** Approved

---

## Problem Statement

O comportamento atual de movimentação em raios tem uma lacuna crítica: quando o dado de um jogador
**ultrapassa o hub** (posição 0) na direção do hub, o movimento simplesmente é descartado — nenhum destino
é gerado naquela direção. O correto é o jogador continuar pelo diâmetro e aterrissar no **raio oposto**
(o raio que está exatamente 180° à frente, do lado inverso do hub).

Além disso, o jogador não deve nunca conseguir entrar no hub sem as 6 fatias, e caso o dado caia
exatamente no hub sem as fatias, o hub deve ser excluído e o jogador escolher outras casas disponíveis.

---

## Goals

- [ ] Overshoot em raio na direção do hub → continuar pelo diâmetro aterrisando no raio oposto (**novo**)
- [ ] Hub acessível apenas com 6 fatias (já implementado via `canAccessHub` — **verificar e documentar**)
- [ ] Hub bloqueado sem 6 fatias → hub excluído dos destinos, jogador escolhe outras casas (**verificar e documentar**)

---

## Out of Scope

| Feature                                                                | Reason                                                                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Movimento passo-a-passo através do hub                                 | Não muda o paradigma "jump to destination" já adotado no projeto                                                       |
| Restringir entrada em raios laterais a partir do anel                  | Ao sair do raio para o anel (via HQ), o jogador está no anel e pode usar qualquer entrada disponível no turno seguinte |
| Restringir entrada de raios laterais a partir do hub no início do jogo | `mustLeaveHub = true` no início é um exit obrigatório do hub, todos os raios devem ser acessíveis                      |
| Animação da trajetória pelo hub até o raio oposto                      | Animação apenas no tile de destino final                                                                               |

---

## User Stories

### SDN-01: Travessia do diâmetro completo (overshoot hub → raio oposto) ⭐ MVP

**User Story:** Como jogador, quando estou em um raio e o dado ultrapassa o hub, quero continuar pelo
diâmetro e aterrissar no raio oposto, para que o movimento ao longo do eixo faça sentido estratégico.

**Why P1:** Sem isso, o movimento em direção ao hub é uma dead-end quando o dado ultrapassa — comportamento
ilógico e frustrante que quebra a natureza bidirecional do eixo diametral.

**Acceptance Criteria:**

1. WHEN o jogador está em um spoke tile no índice `idx` (0=próximo à HQ, 4=próximo ao hub) E rola `D` onde `idx + D > 5` (overshoot além do hub) THEN sistema SHALL oferecer como destino o tile `SPOKES[(spokeIndex + 3) % 6].tiles[5 - k]` onde `k = idx + D - 5`
2. WHEN o overshoot ocorre THEN o destino gerado SHALL sempre estar dentro dos 5 tiles do raio oposto (com d6 e idx ∈ [0..4], k ∈ [1..5], sempre válido)
3. WHEN o jogador está em qualquer tile do raio E dá overshoot THEN sistema SHALL NOT oferecer raios laterais (raios que não são o próprio nem o oposto)
4. WHEN o dado cai EXATAMENTE no hub (`idx + D == 5`) E o jogador NÃO tem 6 fatias E `canAccessHub = false` THEN hub SHALL NOT ser oferecido como destino E o jogador SHALL ter destinos disponíveis pela direção do anel (toward ring)
5. WHEN o dado cai EXATAMENTE no hub (`idx + D == 5`) E o jogador TEM 6 fatias E `canAccessHub = true` THEN hub SHALL ser oferecido como destino (e vencer o Desafio Final = vitória)
6. WHEN `idx + D > 5` (overshoot) THEN o sistema SHALL transitar pelo hub como waypoint E aterrissar no raio oposto, independente de `canAccessHub` (o hub não é o tile de destino, é apenas atravessado)

**Independent Test:** Jogador em SPOKES[0].tiles[4] (posição 47, idx=4), rola D=2 → overshoot: k=1, raio oposto = SPOKES[3].tiles[4] (posição 62). `getValidDestinations(47, 2, false)` deve retornar `[62, 45]` (62 = raio oposto, 45 = direção do anel).

---

### SDN-02: Hub bloqueado sem 6 fatias ✅ Já implementado

**User Story:** Como jogador, eu não quero poder mover para o hub central antes de ter todas as 6 fatias,
para que a progressão do jogo seja preservada.

**Status:** IMPLEMENTADO — `canAccessHub = player.wedges.length === 6 && !player.mustLeaveHub` é computado
em `game.service.ts` (move) e `GamePage.tsx` (handleRollDice) e passado como 3º parâmetro para
`getValidDestinations`. Hub excluído de todos os destinos quando `canAccessHub = false`.

**Acceptance Criteria (verificação):**

1. WHEN jogador tem < 6 fatias THEN `getValidDestinations` SHALL NOT incluir posição 0 em nenhum resultado
2. WHEN `canAccessHub = true` E dado permite alcançar hub THEN posição 0 SHALL aparecer em `getValidDestinations`
3. WHEN `mustLeaveHub = true` E jogador tem 6 fatias THEN hub SHALL ser excluído até o jogador sair do hub

---

### SDN-03: Hub bloqueado → escolher outras casas ✅ Já implementado

**User Story:** Como jogador, quando o dado cai no hub mas não tenho 6 fatias, quero receber opções
alternativas de casas para que o turno não seja perdido.

**Status:** IMPLEMENTADO — com `canAccessHub = false`, hub é excluído e o jogador recebe os destinos
disponíveis nas outras direções (toward-ring do spoke, ou fwd/bwd do anel). Sempre há pelo menos 1
destino alternativo disponível.

**Acceptance Criteria (verificação):**

1. WHEN hub está bloqueado E dado cai exatamente no hub THEN `validDestinations.length` SHALL ser ≥ 1 (pelo menos um destino alternativo)
2. WHEN hub está bloqueado E dado cai exatamente no hub de um spoke tile THEN sistema SHALL oferecer destinos pela direção toward-ring

---

## Topologia do Diâmetro (referência)

```
Raio 0 (Geography, HQ=7)  ↔  Raio 3 (Art, HQ=28)       → (0+3)%6 = 3
Raio 1 (Entertainment, HQ=14)  ↔  Raio 4 (Science, HQ=35)   → (1+3)%6 = 4
Raio 2 (History, HQ=21)  ↔  Raio 5 (Sports, HQ=42)      → (2+3)%6 = 5
```

Fórmula canônica do raio oposto: `oppSpokeIndex = (spokeIndex + 3) % 6`

---

## Algorithm Update (CASE 2 — spoke tile, toward-hub branch)

```
ANTES:
  if idx + D ≤ 4: add SPOKES[S].tiles[idx + D]
  if idx + D == 5 AND canAccessHub: add hub (0)
  // idx + D > 5: NADA — dead end

DEPOIS:
  if idx + D ≤ 4: add SPOKES[S].tiles[idx + D]
  if idx + D == 5 AND canAccessHub: add hub (0)     ← inalterado
  if idx + D > 5:                                    ← NOVO
      k = idx + D - 5                                 (k ∈ [1..5] com d6)
      oppS = (S + 3) % 6
      add SPOKES[oppS].tiles[5 - k]
```
