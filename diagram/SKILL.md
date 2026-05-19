---
name: diagram
description: Create diagrammatic explanations as high-resolution PNGs and open them in Preview. Use when the user asks to diagram, draw out, show flow, map logic, explain architecture/control flow/data flow, or when text walkthroughs are hard to understand.
---

# Diagram

Use this skill when user wants visual explanation: diagram, draw it out, show flow, call graph, architecture, sequence, state machine, data flow, control flow, dependency map, or logic map.

## Output contract

- Create Mermaid source in `/tmp`.
- Render high-resolution PNG in `/tmp`.
- Open PNG in system image viewer when available.
- Reply with PNG path and source `.mmd` path.
- Keep text explanation short; diagram is main artifact.

## Diagram style

Pick simplest Mermaid diagram type:

- `flowchart TD` for call flow, architecture, data/control flow.
- `sequenceDiagram` for request/response interactions.
- `stateDiagram-v2` for lifecycle/state transitions.
- `classDiagram` only for type/object relationships.

Guidelines:

- Prefer concrete function/file names from current context.
- Group by boundary if useful: user, runtime, broker, sandbox, provider, external service.
- Keep node labels readable; avoid long prose in boxes.
- Quote labels containing punctuation, slashes, parentheses, or path-like text, e.g. `A["/diagram <prompt>"]`.
- For dense systems, make 2 diagrams rather than one unreadable diagram.
- If source details are missing, inspect relevant files first.

## Render

1. Write source to a unique path, e.g. `/tmp/agent-diagram-<topic>-<timestamp>.mmd`.
2. Render and open:

```bash
./diagram/scripts/render-mermaid.sh /tmp/agent-diagram-topic.mmd
```

The script writes `/tmp/agent-diagram-topic.png` unless an output path is passed.

Optional env for large diagrams:

```bash
DIAGRAM_WIDTH=3200 DIAGRAM_HEIGHT=2400 DIAGRAM_SCALE=4 ./diagram/scripts/render-mermaid.sh input.mmd output.png
```

For quick validation without opening Preview:

```bash
DIAGRAM_OPEN=0 ./diagram/scripts/render-mermaid.sh input.mmd output.png
```

If render fails, fix Mermaid syntax and rerun. Do not leave user with only Mermaid text unless rendering is impossible.
