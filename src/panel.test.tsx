// `orca plugin test .` runs this in Node with the same runtime and checks Orca uses.
import { assert, mount, test } from 'orca/testing'
import { TERMS } from './content'
import { addDays, dayKey, lastWeek, pickBite, question, recordDay, streakLength, term } from './progress'
import * as panel from './panel'

const has = (view: { summary(): string[] }, text: string) => view.summary().some((line) => line.includes(text))

test('streak counts consecutive days and forgives an unfinished today', () => {
  const now = new Date(2026, 10, 17)
  const d = (n: number) => dayKey(addDays(now, n))
  assert.equal(streakLength([], now), 0)
  assert.equal(streakLength([d(-2), d(-1)], now), 2)
  assert.equal(streakLength([d(-2), d(-1), d(0)], now), 3)
  assert.equal(streakLength([d(-3), d(-1)], now), 1)
  assert.equal(streakLength([d(-3)], now), 0)
  assert.deepEqual(recordDay([d(0), d(-1)], now), [d(-1), d(0)])
  const week = lastWeek([d(0), d(-2)], now)
  assert.equal(week.length, 7)
  assert.deepEqual(week.filter((w) => w.done).map((w) => w.key), [d(-2), d(0)])
  assert.equal(week[6].label, 'Today')
})

test('a bite serves the next three unlearned cards and a question from their unit', () => {
  const bite = pickBite([], [])
  assert.deepEqual(bite.cards, TERMS.slice(0, 3).map((t) => t.id))
  assert.equal(question(bite.questionId).topic, term(bite.cards[0]).topic)
  const later = pickBite(TERMS.slice(0, 8).map((t) => t.id), [])
  assert.equal(later.topic, 'inside')
  const review = pickBite(TERMS.map((t) => t.id), [])
  assert.equal(review.review, true)
  assert.equal(review.cards.length, 3)
})

test('library → dashboard → bite → complete builds the streak and XP', async () => {
  const view = await mount(panel)
  assert.ok(has(view, 'Pick your next quest'))
  assert.ok(view.find({ text: 'Neural Networks' }))

  await view.press({ text: 'Continue' })
  assert.ok(view.find({ text: 'DAY STREAK' }))
  await view.press({ text: 'Start' })

  const bite = pickBite([], [])
  for (const [i, id] of bite.cards.entries()) {
    assert.ok(view.find({ text: term(id).term }), `card ${id} shows its term`)
    await view.press({ text: 'Flip card' })
    assert.ok(view.find({ text: term(id).definition }))
    await view.press({ text: i === 1 ? 'Not yet' : 'Got it' })
  }

  const q = question(bite.questionId)
  assert.ok(view.find({ text: q.prompt }))
  await view.select({ label: 'Your answer' }, String(q.answer))
  await view.press({ text: 'Check answer' })
  assert.ok(has(view, 'Correct!'))
  await view.press({ text: 'Continue' })

  assert.ok(has(view, 'Bite complete!'))
  assert.deepEqual(view.persisted.plugin.known, [bite.cards[0], bite.cards[2]])
  assert.deepEqual(view.persisted.plugin.days, [dayKey(new Date())])
  assert.equal(view.persisted.plugin.xp, 5 + 5 + 10 + 15)
  assert.deepEqual(view.persisted.plugin.solved, [q.id])
  assert.deepEqual(view.errors, [])
  await view.unmount()
})

test('the dictionary opens from the dashboard and returns there', async () => {
  const view = await mount(panel)
  await view.press({ text: 'Continue' })
  await view.press({ label: 'Open dictionary' })
  assert.ok(has(view, 'Dictionary'))
  await view.type({ label: 'Search the dictionary' }, 'injection')
  const titles = () => view.findAll({ type: 'Collapsible' }).map((c) => c.props.title)
  assert.deepEqual(titles(), ['Prompt injection'])
  await view.type({ label: 'Search the dictionary' }, 'zzzz', { replace: true })
  assert.deepEqual(titles(), [])
  await view.press({ text: '‹ Back' })
  assert.ok(view.find({ text: 'DAY STREAK' }))
  assert.deepEqual(view.errors, [])
  await view.unmount()
})
