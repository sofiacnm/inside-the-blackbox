// `orca plugin test .` runs this in Node with the same runtime and checks Orca uses.
import { assert, mount, test } from 'orca/testing'
import { TERMS } from './content'
import { BLACK_BOX_ID, course, PRACTICE_ID } from './courses'
import { ARTICLES, CARD_IMAGES } from './media'
import { addDays, card, dayKey, pickBite, recentDays, recordDay, streakLength } from './progress'
import * as panel from './panel'

const has = (view: { summary(): string[] }, text: string) => view.summary().some((line) => line.includes(text))
const blackBox = course(BLACK_BOX_ID)
const practice = course(PRACTICE_ID)

test('streak counts consecutive days and forgives an unfinished today', () => {
  const now = new Date(2026, 10, 17)
  const d = (n: number) => dayKey(addDays(now, n))
  assert.equal(streakLength([], now), 0)
  assert.equal(streakLength([d(-2), d(-1)], now), 2)
  assert.equal(streakLength([d(-2), d(-1), d(0)], now), 3)
  assert.equal(streakLength([d(-3), d(-1)], now), 1)
  assert.deepEqual(recordDay([d(0), d(-1)], now), [d(-1), d(0)])
  const recent = recentDays([d(0), d(-2)], now)
  assert.deepEqual(recent.map((w) => w.done), [true, false, true, false, false])
  assert.equal(recent[0].label, 'Today')
})

test('every vocabulary term has a Go deeper article; pictures exist on many cards', () => {
  for (const t of TERMS) assert.ok(ARTICLES[t.id], `${t.id} has an article`)
  assert.ok(Object.keys(CARD_IMAGES).length >= 15)
  for (const c of practice.cards) assert.ok(c.article, `${c.id} has an article`)
})

test('vocabulary quiz: one question per card, wrong answers only from cards already seen', () => {
  const first = pickBite(blackBox, [])
  assert.equal(first.questions.length, first.cards.length)
  first.questions.forEach((q, i) => {
    const target = card(blackBox, first.cards[i])
    const right = q.options[q.answer]
    assert.ok(right === target.term || target.definition.startsWith(right), 'the right answer is about that card')
    // Every option belongs to one of today's cards: nothing the player hasn't met.
    for (const option of q.options) {
      assert.ok(
        first.cards.some((id) => {
          const c = card(blackBox, id)
          return option === c.term || c.definition.startsWith(option)
        }),
        `"${option}" comes from today's cards`,
      )
    }
  })
  const later = pickBite(blackBox, TERMS.slice(0, 12).map((t) => t.id))
  assert.ok(later.questions.every((q) => q.options.length === 4))
  assert.deepEqual(pickBite(blackBox, []).questions, first.questions, 'stable across reloads')
})

test('AI in Practice uses the scenario questions for its own cards', () => {
  const bite = pickBite(practice, [])
  assert.deepEqual(bite.cards, ['p-parameters', 'p-training-data', 'p-llm'])
  assert.deepEqual(
    bite.questions.map((q) => q.id),
    ['q-parameters', 'q-training-data', 'q-llm'],
  )
})

test('library → dashboard → 3 cards → 3 questions → complete', async () => {
  const view = await mount(panel)
  assert.ok(view.find({ text: 'Neural Networks' }))
  await view.press({ text: 'Continue' })
  assert.ok(has(view, '0 day streak'))
  await view.press({ text: 'Start' })

  const bite = pickBite(blackBox, [])
  for (const [i, id] of bite.cards.entries()) {
    assert.ok(view.find({ text: card(blackBox, id).term }))
    await view.press({ text: 'Flip card' })
    assert.ok(view.find({ text: card(blackBox, id).definition }))
    await view.press({ text: i === 1 ? 'Not yet' : 'Got it' })
  }
  for (const [i, q] of bite.questions.entries()) {
    assert.ok(view.find({ text: q.prompt }), 'question shows')
    const pick = i === 2 ? (q.answer + 1) % q.options.length : q.answer
    await view.select({ label: 'Your answer' }, String(pick))
    await view.press({ text: 'Check answer' })
    assert.ok(has(view, i === 2 ? 'Not quite' : 'Correct!'))
    await view.press({ text: i === bite.questions.length - 1 ? 'See results' : 'Next question' })
  }
  assert.ok(has(view, 'Bite complete!'))
  assert.ok(view.find({ text: '2/3' }), 'quiz score shows')
  assert.deepEqual(view.persisted.plugin.known, [bite.cards[0], bite.cards[2]])
  assert.deepEqual(view.persisted.plugin.days, [dayKey(new Date())])
  assert.equal(view.persisted.plugin.xp, 5 + 5 + 10 + 10 + 15)
  assert.deepEqual(view.errors, [])
  await view.unmount()
})

test('a card with a picture shows it, its credit and a Go deeper link before the flip', async () => {
  const view = await mount(panel)
  await view.press({ text: 'Continue' })
  await view.press({ text: 'Start' })
  // Artificial intelligence (the first card) has the AI / ML / deep learning diagram.
  assert.equal(view.find({ type: 'Image' })?.props.src, 'assets/images/ai-ml-dl.jpg')
  assert.ok(view.find({ text: `${ARTICLES.ai.title} →` }))
  assert.deepEqual(view.errors, [])
  await view.unmount()
})

test('AI in Practice can be started from the library', async () => {
  const view = await mount(panel)
  await view.press({ text: 'Start course' })
  assert.ok(has(view, 'AI IN PRACTICE') || view.find({ text: /AI IN PRACTICE/ }))
  await view.press({ text: 'Start' })
  assert.ok(view.find({ text: 'The unreadable model' }))
  assert.ok(view.find({ text: 'SITUATION' }))
  assert.equal(view.persisted.plugin.activeCourse, PRACTICE_ID)
  await view.unmount()
})

test('community and dictionary open and return', async () => {
  const view = await mount(panel)
  await view.press({ text: 'See community →' })
  assert.ok(has(view, 'The community is on its way'))
  await view.press({ text: '‹ Back' })
  await view.press({ text: 'Dictionary' })
  await view.type({ label: 'Search the dictionary' }, 'injection')
  assert.deepEqual(
    view.findAll({ type: 'Collapsible' }).map((c) => c.props.title),
    ['Prompt injection'],
  )
  await view.press({ text: '‹ Back' })
  assert.ok(view.find({ text: 'Top courses' }))
  await view.unmount()
})
