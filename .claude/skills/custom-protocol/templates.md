# Custom Protocol Templates

## 0. Sprint README (orchestration index + checkpoint)

```markdown
# Sprint: <Nome Sprint>

## Visão Geral

[Um parágrafo resumindo o objetivo da sprint — extraído do PRD.]

→ [PRD.md](./PRD.md)

---

## Roteiro da Sprint

> Rascunho no passo 0.6, fechado e aprovado pelo humano na Phase 4: uma linha por task. O arquivo da
> task e a spec só nascem quando a task fica ativa — até lá as colunas Task e Spec ficam sem link.

| #   | Task                                   | Objetivo    | Depende de | Spec                        | ADRs relacionados                                  | Status |
| --- | -------------------------------------- | ----------- | ---------- | --------------------------- | -------------------------------------------------- | ------ |
| 01  | [Task 01 — <título>](tasks/task-01.md) | <uma linha> | —          | [Spec 01](specs/spec-01.md) | [ADR 01](ADRs/adr-01.md)                           | ✅     |
| 02  | [Task 02 — <título>](tasks/task-02.md) | <uma linha> | 01         | [Spec 02](specs/spec-02.md) | [ADR 01](ADRs/adr-01.md), [ADR 02](ADRs/adr-02.md) | 🔄     |
| 03  | Task 03 — <título>                     | <uma linha> | 02         | —                           | —                                                  | 🔲     |

Legenda: 🔲 não iniciada · 🔄 em andamento · ✅ concluída · 🚫 bloqueada (o motivo fica em Riscos e Decisões Abertas) · 🗑️ descartada

### Mudanças no Roteiro

> Só depois da aprovação na Phase 4. Ajustes no rascunho não entram aqui.

| Quando (task ativa) | Mudança | Motivo |
| ------------------- | ------- | ------ |
| ...                 | ...     | ...    |

---

## Checkpoint da Sprint

> Atualizar antes de avançar entre fases. Uma fase só começa quando a anterior está marcada como concluída aqui.
- [ ] Requisito aprofundado e PRD aprovado pelo humano
- [ ] ADRs mínimos criados
- [ ] Roteiro aprovado pelo humano (Phase 4)
- [ ] Todas as linhas do roteiro ✅ ou 🗑️ (cada task: ativação → spec → RED → GREEN → refatoração → Registro)
- [ ] Testes, lint, typecheck e build passando na árvore final
- [ ] Critical code review concluída (REVIEW.md)
- [ ] Security scan concluído e achados decididos pelo humano (security-scan.md), ou dispensado com o motivo
- [ ] Revisão visual no navegador feita pelo humano
- [ ] Sprint entregue com resumo e riscos residuais
- [ ] Merge na main (humano)

---

## Riscos e Decisões Abertas

| Item | Decisão pendente | Responsável |
| ---- | ---------------- | ----------- |
| ...  | ...              | ...         |
```

---

## 0a. Task (escrita na ativação, nunca antes)

```markdown
# Task NN — <título>

> Ativada em <data>. Linha original do roteiro: "<objetivo de uma linha>".

## Objetivo

[O que esta task entrega, em termos de comportamento.]

## Contexto na ativação

[O que as tasks anteriores entregaram e descobriram que muda esta task. Estado atual do código
que ela toca.]

## Escopo

- Dentro:
- Fora:

## Passos

1.
2.

## Critérios de Aceite

- [ ]

## Estratégia de Teste

[Domínio puro, serviços/adapters, integração, smoke de fluxo, e2e — o que se aplica aqui.]

## Dependências

[Tasks fechadas de que depende; contratos que consome.]

## Arquivos compartilhados

[i18n, registries, README da sprint — só edições aditivas.]

## Spec e ADRs

- Spec: [Spec NN](../specs/spec-NN.md)
- ADRs: [ADR NN](../ADRs/adr-NN.md)

## Progresso

- [ ] Spec escrita e revisada
- [ ] Testes escritos e RED confirmado
- [ ] GREEN
- [ ] Refatoração
- [ ] Specs afetados, lint, typecheck e build passando

## Registro

[Preenchido ao fechar: o que foi entregue, o que divergiu da task como escrita, e o que as próximas
tasks precisam saber. Mudanças no roteiro vão também para a tabela do README.]
```

Uma task sem critérios de aceite ou sem estratégia de teste ainda não é uma task.

---

## 0b. Sprint PRD

```markdown
# PRD — <Nome Sprint>

## Objetivo

[O que será construído e por quê. Uma ou duas frases diretas.]

## Contexto

[Situação atual, problema a resolver, motivação de negócio ou técnica.]

## Personas / Stakeholders

- **<Persona 1>:** <descrição breve do perfil e interesse>
- **<Persona 2>:** <descrição breve do perfil e interesse>

## Funcionalidades

1. <Funcionalidade principal>
2. <Funcionalidade secundária>
3. ...

## Critérios de Aceite

- [ ] <comportamento esperado 1>
- [ ] <comportamento esperado 2>
- [ ] <comportamento esperado 3>

## Restrições

- **Técnicas:** <ex: sem dependências externas novas, deve rodar no Node 20+>
- **De negócio:** <ex: não quebrar o fluxo de pagamento existente>
- **De tempo:** <ex: entrega até X data>

## Fora do Escopo

- <item que o usuário mencionou mas está explicitamente excluído>
- ...

## Riscos e Incertezas

| Risco | Impacto | Mitigação |
| ----- | ------- | --------- |
| ...   | ...     | ...       |
```

---

## 1. Requirement Discovery

```text
Context:
[where this happens and why it matters]

Objective:
[expected outcome]

Acceptance criteria:
- ...
- ...

Constraints:
- ...

Failure cases:
- ...

Out of scope:
- ...
```

## 2. Executable Spec

```text
Requirement:
When [event], given [context], the system must [behavior].

Success cases:
- ...

Failure cases:
- ...

Contracts involved:
- ...

Expected states:
- idle
- loading
- success
- error

Out of scope:
- ...
```

## 3. ADR Quick Start

```text
Title:

Status:

Context:

Problem:

Decision:

Consequences:

Alternatives considered:
```

## 4. Action Plan

```text
Action plan
- Understanding:
- Related ADRs:
- Affected layers:
- Testing strategy:
- Steps:
  1.
  2.
  3.
- Risks:
- Final validation:
```

## 5. Final Validation

```text
Final checklist
- [ ] Requirement confirmed with the human
- [ ] Lexomni consulted
- [ ] Context7 consulted when needed
- [ ] ADR correlated or created
- [ ] Executable spec written
- [ ] Tests written before code
- [ ] RED confirmed
- [ ] Minimum implementation done
- [ ] Refactoring completed
- [ ] Tests passed
- [ ] Lint passed
- [ ] Typecheck passed, if it exists
- [ ] Build passed, if it exists
- [ ] Critical code review completed
```
