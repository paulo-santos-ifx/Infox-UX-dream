<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- custom-protocol:start -->
# Custom Protocol

Neste repositório, **sempre** seguir o skill **custom-protocol** em `skills/custom-protocol/SKILL.md`. Em projetos onde você rodou `custom-protocol init`, o mesmo conteúdo fica em `.cursor/skills/` ou `.claude/skills/`, conforme o IDE.

## O que fazer

1. **Antes de planejar ou implementar:** consultar Lexomni (MCP).
2. **Com stack, libs, APIs ou config:** consultar Context7 (MCP) e seguir `context7-mcp/SKILL.md`.
3. **Não saltar para código:** requisito → spec executável → testes → implementação mínima → refatorar → revisão crítica.
4. **Não afirmar "pronto" ou "green"** só porque testes auxiliares passam; o critério de aceite é o comportamento acordado (ex.: CLI completo, não só stubs).

## O que não fazer

- Implementar features ou "corrigir" fluxos **fora** desta sequência (sem spec, sem testes quando a mudança o exige).
- Rodar testes ou builds **só para "mostrar resultado"** se o humano pediu explicitamente testar ou validar.
- Substituir o protocolo por sub-skills isoladas; usar sub-skills em cascata e voltar ao workflow principal.

## Comando `/custom-protocol`

Quando o usuário invocar `/custom-protocol`, tratar como **ordem explícita** de seguir o checklist e as fases do `SKILL.md` até o ponto em que o humano aprovar ou pedir parar.
<!-- custom-protocol:end -->
