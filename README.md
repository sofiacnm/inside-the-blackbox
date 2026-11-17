# Inside the Black Box

An Orca sidebar panel that explains AI and AI safety for designers: what happens inside the
model, where it goes wrong, and how people keep it safe. Every term comes with a plain-language
definition and a **designer's lens**, an analogy from design practice.

A daily, game-like path with an orca guide:

1. **Course library**: pick a quest. Inside the Black Box is live; the other courses (Tokens, Matrices, Neural Networks, AI Safety, Probability, Binary, Algorithms) are on the way.
2. **Dashboard**: your day streak, this week, XP and level, today's 5-minute bite and your path through the 5 units.
3. **Flashcards**: three new terms a day. Flip each to see its definition and designer's lens, then "Got it" or "Not yet".
4. **Quiz**: one scenario question with an explanation.
5. **Bite complete**: streak, XP and what's coming tomorrow.

The **dictionary** of all 40 terms is one tap away from the library and dashboard.

Topics: The basics · Inside the model · Shaping behavior · Where it goes wrong · AI safety.

## Install

```sh
orca plugin install sofiacnm/orca-workshop-plugin
```

The plugin only draws a sandboxed panel. It asks for no network, file or terminal access.

## Image credits

| Image | Author | License | Source |
| --- | --- | --- | --- |
| Neural network diagram | Glosser.ca | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Colored_neural_network.svg |
| Matrix multiplication diagram | Lakeworks | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Matrix_multiplication_diagram_2.svg |
| Word embedding illustration | Fschwarzentruber | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Word_embedding_illustration.svg |
| Feature visualization | Olah, Mordvintsev & Schubert, Distill | CC BY 4.0 | https://distill.pub/2017/feature-visualization/ |

The diagrams were converted to JPEG on a white background; they are otherwise unchanged.

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
