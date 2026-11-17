import {
  atom,
  Badge,
  Box,
  Button,
  Callout,
  Collapsible,
  EmptyState,
  Grid,
  Heading,
  IconButton,
  Image,
  Input,
  Link,
  List,
  ListItem,
  Progress,
  RadioGroup,
  read,
  Row,
  set,
  Stack,
  Text,
  update,
} from 'orca'
import { searchTerms, TERMS, topicLabel, TOPICS } from './content'
import { BLACK_BOX_ID, COURSES, UNIT_IMAGES, type Course, type CourseImage } from './courses'
import {
  CARDS_PER_BITE,
  currentTopic,
  dayKey,
  lastWeek,
  level,
  pickBite,
  question,
  recordDay,
  streakLength,
  term,
  XP_PER_BITE,
  XP_PER_CARD,
  XP_PER_CORRECT,
  type Bite,
} from './progress'

type View = 'library' | 'course' | 'lesson' | 'complete' | 'dictionary'

interface Lesson {
  bite: Bite
  step: number
  flipped: boolean
  choice: string
  checked: boolean
  xp: number
  learned: number
}

// Keyed atoms survive hot reloads; `persist: 'plugin'` ones also survive restarts.
const view = atom<View>('view', 'library')
const returnTo = atom<View>('returnTo', 'library')
const lesson = atom<Lesson | null>('lesson', null)
const query = atom('query', '')
const known = atom<string[]>('known', [], { persist: 'plugin' })
const solved = atom<string[]>('solved', [], { persist: 'plugin' })
const days = atom<string[]>('days', [], { persist: 'plugin' })
const xp = atom('xp', 0, { persist: 'plugin' })

const go = (next: View) => set(view, next)

function openDictionary() {
  const from = read(view)
  if (from !== 'dictionary') set(returnTo, from)
  go('dictionary')
}

function startBite() {
  const bite = pickBite(read(known), read(solved), read(days).length)
  set(lesson, { bite, step: 0, flipped: false, choice: '', checked: false, xp: 0, learned: 0 })
  go('lesson')
}

function patchLesson(patch: Partial<Lesson>) {
  update(lesson, (l) => (l ? { ...l, ...patch } : l))
}

function answerCard(gotIt: boolean) {
  const l = read(lesson)
  if (!l) return
  const id = l.bite.cards[l.step]
  if (gotIt) update(known, (ids) => (ids.includes(id) ? ids : [...ids, id]))
  patchLesson({
    step: l.step + 1,
    flipped: false,
    xp: l.xp + (gotIt ? XP_PER_CARD : 0),
    learned: l.learned + (gotIt ? 1 : 0),
  })
}

function checkAnswer() {
  const l = read(lesson)
  if (!l) return
  const q = question(l.bite.questionId)
  const correct = l.choice === String(q.answer)
  if (correct) update(solved, (ids) => (ids.includes(q.id) ? ids : [...ids, q.id]))
  patchLesson({ checked: true, xp: l.xp + (correct ? XP_PER_CORRECT : 0) })
}

function finishBite() {
  const l = read(lesson)
  if (!l) return
  const earned = l.xp + XP_PER_BITE
  patchLesson({ xp: earned })
  update(xp, (n) => n + earned)
  update(days, (d) => recordDay(d, new Date()))
  go('complete')
}

// ——— Shared pieces ———

function DictionaryButton() {
  return (
    <Row justify="end">
      <IconButton icon="book" label="Open dictionary" tooltip="Dictionary" variant="solid" tone="accent" onPress={openDictionary} />
    </Row>
  )
}

function Credit({ image }: { image: CourseImage }) {
  return (
    <Row>
      <Text muted size="xs">
        {`Image: ${image.credit.text} · `}
        <Link href={image.credit.href}>source</Link>
      </Text>
    </Row>
  )
}

function Week() {
  const week = lastWeek(read(days), new Date())
  return (
    <Row justify="between">
      {week.map((d) => (
        <Stack key={d.key} gap="xs" align="center">
          <Box
            width={34}
            height={34}
            radius="sm"
            align="center"
            justify="center"
            background={d.done ? 'accent' : 'none'}
            border={d.done ? false : 'accent'}
          >
            {d.done ? <Image src="assets/icons/check.png" alt="Done" size="xs" /> : null}
          </Box>
          <Text size="xs" muted={!d.today} weight={d.today ? 'semibold' : 'regular'}>
            {d.label}
          </Text>
        </Stack>
      ))}
    </Row>
  )
}

// ——— 1. Course library ———

function CourseCard({ course }: { course: Course }) {
  const badge =
    course.status === 'capstone' ? <Badge>Capstone</Badge> : course.status === 'soon' ? <Badge>Coming soon</Badge> : null
  return (
    <Box border radius="md" padding="sm">
      <Row gap="md" align="start">
        <Box width={64} height={64} shrink={false} radius="sm" align="center" justify="center">
          {course.image ? (
            <Image src={course.image.src} alt={course.image.alt} size="full" fit="cover" rounded />
          ) : (
            <Image src={course.icon} alt="" size="full" fit="contain" />
          )}
        </Box>
        <Box grow>
          <Stack gap="xs">
            <Row justify="between" align="center">
              <Text weight="semibold">{course.title}</Text>
              {badge}
            </Row>
            <Text muted size="sm">
              {course.blurb}
            </Text>
            {course.image ? <Credit image={course.image} /> : null}
          </Stack>
        </Box>
      </Row>
    </Box>
  )
}

function Library() {
  const streak = streakLength(read(days), new Date())
  const learned = read(known).length
  const doneToday = read(days).includes(dayKey(new Date()))
  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <Row justify="between">
          <Text muted size="sm" weight="medium">
            GOOD MORNING, DESIGNER
          </Text>
          <Badge tone="accent">{streak === 0 ? 'Start a streak' : `${streak} day streak`}</Badge>
        </Row>
        <Heading level={1}>Pick your next quest</Heading>
        <Text muted>Bite-sized courses on how AI really works. Five minutes a day keeps the black box open.</Text>
      </Stack>

      <Box border="accent" radius="lg" padding="md">
        <Row gap="md" align="center">
          <Box grow>
            <Stack gap="sm">
              <Badge tone="accent">{doneToday ? 'Done for today' : `Continue · day ${streak + 1}`}</Badge>
              <Heading level={2}>Inside the Black Box</Heading>
              <Text muted size="sm">{`The language of AI, one card a day. ${TERMS.length} terms · ${TOPICS.length} units.`}</Text>
              <Progress label={`${learned} of ${TERMS.length} learned`} value={Math.round((learned / TERMS.length) * 100)} />
              <Row>
                <Button variant="solid" tone="accent" icon="play" onPress={() => go('course')}>
                  Continue
                </Button>
              </Row>
            </Stack>
          </Box>
          <Image src="assets/images/orca.png" alt="Orca, your guide" size="sm" fit="contain" />
        </Row>
      </Box>

      <Stack gap="sm">
        <Heading level={3}>Top courses</Heading>
        <Stack gap="sm">
          {COURSES.filter((c) => c.id !== BLACK_BOX_ID).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </Stack>
      </Stack>
      <DictionaryButton />
    </Stack>
  )
}

// ——— 2. Course dashboard ———

function Course() {
  const now = new Date()
  const finished = read(days)
  const streak = streakLength(finished, now)
  const doneToday = finished.includes(dayKey(now))
  const knownIds = read(known)
  const points = read(xp)
  const bite = pickBite(knownIds, read(solved), finished.length)
  const topicId = currentTopic(knownIds)
  const preview = UNIT_IMAGES[bite.topic]
  return (
    <Stack gap="lg">
      <Row justify="between">
        <Button variant="ghost" size="sm" onPress={() => go('library')}>
          ‹ Courses
        </Button>
        <Row gap="xs">
          <Badge>{`LV ${level(points)}`}</Badge>
          <Badge>{`${points} XP`}</Badge>
        </Row>
      </Row>

      <Stack gap="md">
        <Row gap="md" align="center">
          <Image src="assets/icons/flame.png" alt="" size="sm" />
          <Stack gap="xs">
            <Heading level={1}>{String(streak)}</Heading>
            <Text muted size="sm" weight="medium">
              DAY STREAK
            </Text>
          </Stack>
        </Row>
        <Week />
        <Text muted size="sm">
          {doneToday ? 'Done for today. Come back tomorrow to keep the streak.' : `Finish today's bite to reach ${streak + 1} ${streak === 0 ? 'day' : 'days'}.`}
        </Text>
      </Stack>

      <Box border radius="lg" padding="md">
        <Stack gap="md">
          <Row justify="between">
            <Text tone="accent" size="xs" weight="semibold">
              {bite.review ? "TODAY'S REVIEW · 5 MIN" : "TODAY'S BITE · 5 MIN"}
            </Text>
            <Text muted size="xs">{`+${CARDS_PER_BITE * XP_PER_CARD + XP_PER_CORRECT + XP_PER_BITE} XP`}</Text>
          </Row>
          <Heading level={3}>{topicLabel(bite.topic)}</Heading>
          <Text muted size="sm">{`${bite.cards.length} cards and a quick quiz: ${bite.cards.map((id) => term(id).term).join(', ')}.`}</Text>
          {preview ? (
            <Stack gap="xs">
              <Image src={preview.src} alt={preview.alt} size="md" fit="contain" rounded />
              <Credit image={preview} />
            </Stack>
          ) : null}
          <Button variant="solid" tone="accent" icon="play" onPress={startBite}>
            {doneToday ? 'Practice another bite' : 'Start'}
          </Button>
        </Stack>
      </Box>

      <List label="Your path">
        {TOPICS.map((t, i) => {
          const terms = TERMS.filter((x) => x.topic === t.id)
          const have = terms.filter((x) => knownIds.includes(x.id)).length
          const done = have === terms.length
          const current = t.id === topicId && !done
          return (
            <ListItem
              key={t.id}
              icon={done ? 'check' : current ? 'play' : 'flag'}
              title={`${i + 1}. ${t.label}`}
              description={`${have}/${terms.length} learned${current ? ' · you are here' : ''}`}
              current={current}
            />
          )
        })}
      </List>
      <DictionaryButton />
    </Stack>
  )
}

// ——— 3–5. Lesson: flashcards, then a quiz ———

function LessonView() {
  const l = read(lesson)
  if (!l) return <EmptyState icon="book" title="No lesson in progress" />
  const total = l.bite.cards.length + 1
  const onQuiz = l.step >= l.bite.cards.length
  return (
    <Stack gap="lg">
      <Row gap="sm" align="center">
        <IconButton icon="close" label="Quit lesson" variant="ghost" onPress={() => go('course')} />
        <Box grow>
          <Progress label="Lesson progress" labelHidden value={Math.round(((l.step + (l.checked ? 1 : 0)) / total) * 100)} />
        </Box>
        <Text size="sm" weight="semibold">{`${Math.min(l.step + 1, total)}/${total}`}</Text>
      </Row>
      {onQuiz ? <QuizStep lesson={l} /> : <CardStep lesson={l} />}
    </Stack>
  )
}

function CardStep({ lesson: l }: { lesson: Lesson }) {
  const card = term(l.bite.cards[l.step])
  return (
    <Box border="accent" radius="lg" padding="lg">
      <Stack gap="lg">
        <Row justify="between">
          <Text muted size="xs" weight="semibold">
            {l.flipped ? 'DEFINITION' : l.bite.review ? 'REVIEW' : 'NEW TERM'}
          </Text>
          <Badge>{topicLabel(card.topic)}</Badge>
        </Row>
        {l.flipped ? (
          <Stack gap="md">
            <Heading level={2}>{card.term}</Heading>
            <Text>{card.definition}</Text>
            <Callout tone="accent" icon="lightbulb" title="Designer's lens">
              <Text>{card.lens}</Text>
            </Callout>
            <Row gap="sm">
              <Button variant="outline" onPress={() => answerCard(false)}>
                Not yet
              </Button>
              <Button variant="solid" tone="accent" icon="check" onPress={() => answerCard(true)}>
                Got it
              </Button>
            </Row>
          </Stack>
        ) : (
          <Stack gap="lg" align="center">
            <Heading level={1}>{card.term}</Heading>
            <Text muted>Say what you think it means out loud. Then flip.</Text>
            <Button variant="solid" tone="accent" icon="refresh" onPress={() => patchLesson({ flipped: true })}>
              Flip card
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

function QuizStep({ lesson: l }: { lesson: Lesson }) {
  const q = question(l.bite.questionId)
  const correct = l.choice === String(q.answer)
  return (
    <Stack gap="md">
      <Text tone="accent" size="xs" weight="semibold">
        QUICK QUIZ
      </Text>
      <Heading level={2}>{q.prompt}</Heading>
      <RadioGroup
        label="Your answer"
        labelHidden
        value={l.choice}
        disabled={l.checked}
        options={q.options.map((label, i) => ({ value: String(i), label }))}
        onChange={(value) => patchLesson({ choice: value })}
      />
      {l.checked ? (
        <Stack gap="md">
          <Callout
            tone={correct ? 'success' : 'danger'}
            icon={correct ? 'check' : 'close'}
            title={correct ? `Correct! +${XP_PER_CORRECT} XP` : `Not quite. The answer is "${q.options[q.answer]}"`}
          >
            <Text>{q.explain}</Text>
          </Callout>
          <Button variant="solid" tone={correct ? 'success' : 'accent'} icon="next" onPress={finishBite}>
            Continue
          </Button>
        </Stack>
      ) : (
        <Button variant="solid" tone="accent" icon="check" disabled={l.choice === ''} onPress={checkAnswer}>
          Check answer
        </Button>
      )}
    </Stack>
  )
}

// ——— 6. Bite complete ———

function Complete() {
  const l = read(lesson)
  const streak = streakLength(read(days), new Date())
  const next = pickBite(read(known), read(solved), read(days).length)
  return (
    <Stack gap="lg" align="center">
      <Heading level={1}>Bite complete!</Heading>
      <Image src="assets/images/orca-celebrate.png" alt="Orca celebrating with a heart" size="md" fit="contain" />
      <Box width="100%">
        <Grid columns={3} gap="sm">
          <Box border="accent" radius="md" padding="sm" align="center">
            <Text muted size="xs">STREAK</Text>
            <Heading level={2}>{String(streak)}</Heading>
          </Box>
          <Box border radius="md" padding="sm" align="center">
            <Text muted size="xs">XP</Text>
            <Heading level={2}>{`+${l?.xp ?? 0}`}</Heading>
          </Box>
          <Box border radius="md" padding="sm" align="center">
            <Text muted size="xs">LEARNED</Text>
            <Heading level={2}>{String(read(known).length)}</Heading>
          </Box>
        </Grid>
      </Box>
      <Box width="100%">
        <Week />
      </Box>
      <Box width="100%">
        <Stack gap="xs">
          <Text muted size="xs" weight="semibold">
            TOMORROW
          </Text>
          <Text>{`${next.cards.map((id) => term(id).term).join(', ')}. Come back to keep the streak alive.`}</Text>
        </Stack>
      </Box>
      <Box width="100%">
        <Stack gap="sm">
          <Button variant="solid" tone="accent" onPress={() => go('course')}>
            Back to my path
          </Button>
          <Button variant="ghost" icon="book" onPress={openDictionary}>
            Open the dictionary
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}

// ——— Dictionary (reachable from anywhere) ———

function Dictionary() {
  const results = searchTerms('all', read(query))
  const knownIds = read(known)
  return (
    <Stack gap="md">
      <Row justify="between">
        <Button variant="ghost" size="sm" onPress={() => go(read(returnTo))}>
          ‹ Back
        </Button>
        <Badge>{`${knownIds.length}/${TERMS.length} learned`}</Badge>
      </Row>
      <Heading level={2}>Dictionary</Heading>
      <Input
        label="Search the dictionary"
        labelHidden
        type="search"
        placeholder="Search terms, e.g. hallucination"
        value={read(query)}
        onChange={(value) => set(query, value)}
      />
      {results.length === 0 ? (
        <EmptyState icon="search" title="No matching terms" description="Try another word." />
      ) : (
        <Stack gap="xs">
          {results.map((t) => (
            <Collapsible
              key={t.id}
              title={knownIds.includes(t.id) ? `${t.term} ✓` : t.term}
              description={topicLabel(t.topic)}
            >
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
  switch (read(view)) {
    case 'course':
      return <Course />
    case 'lesson':
      return <LessonView />
    case 'complete':
      return <Complete />
    case 'dictionary':
      return <Dictionary />
    default:
      return <Library />
  }
}
