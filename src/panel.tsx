import {
  atom,
  Badge,
  Box,
  Button,
  Callout,
  Checkbox,
  Collapsible,
  EmptyState,
  Heading,
  Input,
  Progress,
  RadioGroup,
  read,
  Row,
  Select,
  set,
  Stack,
  Tab,
  Tabs,
  Text,
  update,
} from 'orca'
import { questionsFor, searchTerms, TERMS, termsFor, topicLabel, TOPICS, type Term } from './content'

// Keyed atoms survive hot reloads; `persist: 'plugin'` ones also survive restarts.
const tab = atom('tab', 'learn')
const topic = atom('topic', 'all')
const cardIndex = atom('cardIndex', 0)
const flipped = atom('flipped', false)
const known = atom<string[]>('known', [], { persist: 'plugin' })
const query = atom('query', '')
const quizIndex = atom('quizIndex', 0)
const choice = atom('choice', '')
const answered = atom('answered', false)
const score = atom('score', 0)
const best = atom<Record<string, number>>('best', {}, { persist: 'plugin' })

const topicOptions = [
  { value: 'all', label: 'All topics' },
  ...TOPICS.map((t) => ({ value: t.id, label: t.label })),
]

function resetQuiz() {
  set(quizIndex, 0)
  set(choice, '')
  set(answered, false)
  set(score, 0)
}

function chooseTopic(next: string) {
  set(topic, next)
  set(cardIndex, 0)
  set(flipped, false)
  resetQuiz()
}

function moveCard(delta: number, count: number) {
  update(cardIndex, (i) => (i + delta + count) % count)
  set(flipped, false)
}

function toggleKnown(id: string, isKnown: boolean) {
  update(known, (ids) => (isKnown ? [...ids.filter((x) => x !== id), id] : ids.filter((x) => x !== id)))
}

function percent(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

function Flashcard({ card }: { card: Term }) {
  const showBack = read(flipped)
  return (
    <Box border radius="md" padding="lg" background="card">
      <Stack gap="md">
        <Row justify="between">
          <Text muted size="xs" weight="medium">
            {showBack ? 'DEFINITION' : 'TERM'}
          </Text>
          <Badge>{topicLabel(card.topic)}</Badge>
        </Row>
        <Heading level={2}>{card.term}</Heading>
        {showBack ? (
          <Stack gap="md">
            <Text>{card.definition}</Text>
            <Callout tone="accent" icon="lightbulb" title="Designer's lens">
              <Text>{card.lens}</Text>
            </Callout>
          </Stack>
        ) : (
          <Text muted>Say what you think it means, then flip the card.</Text>
        )}
      </Stack>
    </Box>
  )
}

function Learn() {
  const cards = termsFor(read(topic))
  const knownIds = read(known)
  if (cards.length === 0) return <EmptyState icon="book" title="No cards in this topic" />
  const index = Math.min(read(cardIndex), cards.length - 1)
  const card = cards[index]
  const knownHere = cards.filter((c) => knownIds.includes(c.id)).length
  return (
    <Stack gap="md">
      <Flashcard card={card} />
      <Row justify="between" wrap>
        <Row gap="xs">
          <Button variant="ghost" onPress={() => moveCard(-1, cards.length)}>
            Back
          </Button>
          <Button variant="solid" tone="accent" icon="refresh" onPress={() => update(flipped, (f) => !f)}>
            {read(flipped) ? 'Show term' : 'Flip card'}
          </Button>
          <Button variant="ghost" icon="next" onPress={() => moveCard(1, cards.length)}>
            Next
          </Button>
        </Row>
        <Text muted size="sm">
          {`Card ${index + 1} of ${cards.length}`}
        </Text>
      </Row>
      <Checkbox
        label="I know this one"
        checked={knownIds.includes(card.id)}
        onChange={(checked) => toggleKnown(card.id, checked)}
      />
      <Progress label={`Learned ${knownHere} of ${cards.length} in ${topicLabel(read(topic))}`} value={percent(knownHere, cards.length)} />
    </Stack>
  )
}

function Quiz() {
  const currentTopic = read(topic)
  const questions = questionsFor(currentTopic)
  const index = read(quizIndex)
  const total = questions.length
  const correctSoFar = read(score)

  if (total === 0) return <EmptyState icon="flag" title="No questions in this topic" />

  if (index >= total) {
    const bestScore = read(best)[currentTopic] ?? correctSoFar
    const perfect = correctSoFar === total
    return (
      <Stack gap="md">
        <Callout tone={perfect ? 'success' : 'accent'} icon="star" title={`You scored ${correctSoFar} of ${total}`}>
          <Text>
            {perfect
              ? 'Every answer right. You can see inside the box.'
              : 'Review the flashcards for the ones you missed, then try again.'}
          </Text>
        </Callout>
        <Text muted size="sm">{`Best for ${topicLabel(currentTopic)}: ${bestScore} of ${total}`}</Text>
        <Row gap="xs">
          <Button icon="refresh" onPress={resetQuiz}>
            Try again
          </Button>
          <Button variant="ghost" icon="book" onPress={() => set(tab, 'learn')}>
            Study flashcards
          </Button>
        </Row>
      </Stack>
    )
  }

  const q = questions[index]
  const picked = read(choice)
  const isAnswered = read(answered)
  const isCorrect = picked === String(q.answer)
  const last = index === total - 1

  function check() {
    set(answered, true)
    if (isCorrect) update(score, (s) => s + 1)
  }

  function next() {
    if (last) {
      const final = read(score)
      update(best, (b) => ({ ...b, [currentTopic]: Math.max(b[currentTopic] ?? 0, final) }))
    }
    update(quizIndex, (i) => i + 1)
    set(choice, '')
    set(answered, false)
  }

  return (
    <Stack gap="md">
      <Row justify="between">
        <Text muted size="sm">{`Question ${index + 1} of ${total}`}</Text>
        <Badge tone="accent">{`${correctSoFar} correct`}</Badge>
      </Row>
      <Progress label="Quiz progress" labelHidden value={percent(index, total)} />
      <Heading level={3}>{q.prompt}</Heading>
      <RadioGroup
        label="Your answer"
        labelHidden
        value={picked}
        disabled={isAnswered}
        options={q.options.map((label, i) => ({ value: String(i), label }))}
        onChange={(value) => set(choice, value)}
      />
      {isAnswered ? (
        <Stack gap="md">
          <Callout
            tone={isCorrect ? 'success' : 'danger'}
            icon={isCorrect ? 'check' : 'close'}
            title={isCorrect ? 'Correct' : `Not quite. The answer is "${q.options[q.answer]}"`}
          >
            <Text>{q.explain}</Text>
          </Callout>
          <Button icon="next" onPress={next}>
            {last ? 'See results' : 'Next question'}
          </Button>
        </Stack>
      ) : (
        <Button icon="check" disabled={picked === ''} onPress={check}>
          Check answer
        </Button>
      )}
    </Stack>
  )
}

function Glossary() {
  const results = searchTerms(read(topic), read(query))
  return (
    <Stack gap="md">
      <Input
        label="Search the dictionary"
        labelHidden
        type="search"
        placeholder="Search terms, e.g. hallucination"
        value={read(query)}
        onChange={(value) => set(query, value)}
      />
      {results.length === 0 ? (
        <EmptyState icon="search" title="No matching terms" description="Try another word or switch to All topics." />
      ) : (
        <Stack gap="xs">
          {results.map((t) => (
            <Collapsible key={t.id} title={t.term} description={topicLabel(t.topic)}>
              <Stack gap="sm">
                <Text>{t.definition}</Text>
                <Text muted size="sm">{`Designer's lens: ${t.lens}`}</Text>
              </Stack>
            </Collapsible>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export default function Panel() {
  const learned = read(known).filter((id) => TERMS.some((t) => t.id === id)).length
  const current = TOPICS.find((t) => t.id === read(topic))
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Row justify="between">
          <Heading>Inside the Black Box</Heading>
          <Badge tone={learned === TERMS.length ? 'success' : 'neutral'}>{`${learned}/${TERMS.length}`}</Badge>
        </Row>
        <Text muted size="sm">
          A pocket dictionary of AI and AI safety for designers: what happens inside the model, and how people keep it safe.
        </Text>
      </Stack>
      <Select label="Topic" value={read(topic)} options={topicOptions} onChange={chooseTopic} />
      {current ? (
        <Text muted size="xs">
          {current.blurb}
        </Text>
      ) : null}
      <Tabs label="Mode" value={read(tab)} onChange={(value) => set(tab, value)}>
        <Tab value="learn" label="Flashcards" icon="layers">
          <Learn />
        </Tab>
        <Tab value="quiz" label="Quiz" icon="flag">
          <Quiz />
        </Tab>
        <Tab value="glossary" label="Dictionary" icon="book">
          <Glossary />
        </Tab>
      </Tabs>
    </Stack>
  )
}
