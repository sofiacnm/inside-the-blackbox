// `orca plugin test .` runs this in Node with the same runtime and checks Orca uses.
import { assert, mount, test } from 'orca/testing'
import { questionsFor, termsFor } from './content'
import * as panel from './panel'

test('flashcards flip, move and remember what you know', async () => {
  const view = await mount(panel)
  const [first, second] = termsFor('all')
  assert.ok(view.find({ text: first.term }))
  assert.equal(view.find({ text: first.definition }), null)

  await view.press({ text: 'Flip card' })
  assert.ok(view.find({ text: first.definition }))
  assert.ok(view.find({ text: first.lens }))

  await view.toggle({ label: 'I know this one' })
  assert.deepEqual(view.persisted.plugin.known, [first.id])

  await view.press({ text: 'Next' })
  assert.ok(view.find({ text: second.term }))
  assert.equal(view.find({ text: second.definition }), null)
  assert.deepEqual(view.errors, [])
  await view.unmount()
})

test('topic filter limits the deck', async () => {
  const view = await mount(panel)
  await view.select({ label: 'Topic' }, 'safety')
  assert.ok(view.find({ text: termsFor('safety')[0].term }))
  assert.ok(view.find({ text: `Card 1 of ${termsFor('safety').length}` }))
  await view.unmount()
})

test('quiz scores answers and records the best score', async () => {
  const view = await mount(panel)
  await view.select({ label: 'Topic' }, 'risks')
  await view.select({ label: 'Mode' }, 'quiz')
  const questions = questionsFor('risks')
  for (const [i, q] of questions.entries()) {
    // Answer the first one wrong, the rest right.
    const pick = i === 0 ? (q.answer + 1) % q.options.length : q.answer
    await view.select({ label: 'Your answer' }, String(pick))
    await view.press({ text: 'Check answer' })
    const callout = view.summary().find((line) => line.startsWith('Callout'))
    assert.ok(callout?.startsWith(i === 0 ? 'Callout danger "Not quite' : 'Callout success "Correct'), callout)
    await view.press({ text: i === questions.length - 1 ? 'See results' : 'Next question' })
  }
  const expected = questions.length - 1
  assert.ok(view.summary().some((line) => line.includes(`You scored ${expected} of ${questions.length}`)))
  assert.deepEqual(view.persisted.plugin.best, { risks: expected })
  assert.deepEqual(view.errors, [])
  await view.unmount()
})

test('dictionary search filters terms', async () => {
  const view = await mount(panel)
  await view.select({ label: 'Mode' }, 'glossary')
  await view.type({ label: 'Search the dictionary' }, 'injection')
  const titles = () => view.findAll({ type: 'Collapsible' }).map((c) => c.props.title)
  assert.deepEqual(titles(), ['Prompt injection'])
  await view.type({ label: 'Search the dictionary' }, 'zzzz', { replace: true })
  assert.deepEqual(titles(), [])
  assert.ok(view.summary().some((line) => line.includes('No matching terms')))
  await view.unmount()
})
