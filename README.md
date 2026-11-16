# Inside the Black Box

An Orca sidebar panel that explains AI and AI safety for designers: what happens inside the
model, where it goes wrong, and how people keep it safe. Every term comes with a plain-language
definition and a **designer's lens**, an analogy from design practice.

- **Flashcards**: flip a term to see its definition and designer's lens; mark the ones you know.
- **Quiz**: scenario questions per topic, with explanations and a saved best score.
- **Dictionary**: search all 40 terms.

Topics: The basics · Inside the model · Shaping behavior · Where it goes wrong · AI safety.

## Install

```sh
orca plugin install sofiacnm/orca-workshop-plugin
```

The plugin only draws a sandboxed panel. It asks for no network, file or terminal access.

## Edit the content

All terms and questions live in `src/content.ts`. Add a `Term` or `Question` there and the
flashcards, quiz and dictionary pick it up.

## Develop

Orca transpiles `src/panel.tsx` when the panel loads: no build step. `tsconfig.json` extends the
typings that `orca plugin types .` writes to `.orca/types/`.

```sh
orca plugin dev watch .   # load into Orca, stream logs, reload on save
orca plugin test .        # src/panel.test.tsx
orca plugin check .       # render once and report errors
npx tsc -p .              # type-check
orca plugin validate .
```

See https://github.com/stablyai/orca/blob/main/docs/reference/plugin-authoring.md.
