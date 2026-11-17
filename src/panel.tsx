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
import { searchTerms, TERMS, topicLabel } from './content'
import {
  BLACK_BOX_ID,
  course as getCourse,
  COURSES,
  unitLabel,
  type Article,
  type Card,
  type CardImage,
  type Course,
  type PlayableCourse,
} from './courses'
import { ARTICLES } from './media'
import {
  card as getCard,
  currentUnit,
  dayKey,
  level,
  pickBite,
  recentDays,
  recordDay,
  streakLength,
  XP_PER_BITE,
  XP_PER_CARD,
  XP_PER_CORRECT,
  type Bite,
} from './progress'

type View = 'library' | 'course' | 'lesson' | 'complete' | 'dictionary' | 'community'

interface Lesson {
  bite: Bite
  /** 0..cards-1 are flashcards, then one quiz question per card. */
  step: number
  flipped: boolean
  choice: string
  checked: boolean
  correct: number
  xp: number
}

// Keyed atoms survive hot reloads; `persist: 'plugin'` ones also survive restarts.
const view = atom<View>('view', 'library')
const returnTo = atom<View>('returnTo', 'library')
const lesson = atom<Lesson | null>('lesson-v2', null)
const query = atom('query', '')
const activeCourse = atom('activeCourse', BLACK_BOX_ID, { persist: 'plugin' })
const known = atom<string[]>('known', [], { persist: 'plugin' })
const days = atom<string[]>('days', [], { persist: 'plugin' })
const xp = atom('xp', 0, { persist: 'plugin' })

const go = (next: View) => set(view, next)
const current = (): PlayableCourse => getCourse(read(activeCourse))
const learnedIn = (c: PlayableCourse, ids: readonly string[]) => c.cards.filter((x) => ids.includes(x.id)).length

/** Opens a side page (dictionary, community) and remembers where to come back to. */
function openPage(page: 'dictionary' | 'community') {
  const from = read(view)
  if (from !== 'dictionary' && from !== 'community') set(returnTo, from)
  go(page)
}

const openDictionary = () => openPage('dictionary')

function openCourse(id: string) {
  set(activeCourse, id)
  go('course')
}

function startBite() {
  const bite = pickBite(current(), read(known), read(days).length)
  set(lesson, { bite, step: 0, flipped: false, choice: '', checked: false, correct: 0, xp: 0 })
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
  patchLesson({ step: l.step + 1, flipped: false, xp: l.xp + (gotIt ? XP_PER_CARD : 0) })
}

function checkAnswer() {
  const l = read(lesson)
  if (!l) return
  const q = l.bite.questions[l.step - l.bite.cards.length]
  const correct = l.choice === String(q.answer)
  patchLesson({ checked: true, correct: l.correct + (correct ? 1 : 0), xp: l.xp + (correct ? XP_PER_CORRECT : 0) })
}

function nextQuestion() {
  const l = read(lesson)
  if (!l) return
  const last = l.step - l.bite.cards.length >= l.bite.questions.length - 1
  if (last) return finishBite()
  patchLesson({ step: l.step + 1, choice: '', checked: false })
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
    <Button variant="outline" icon="book" onPress={openDictionary}>
      Dictionary
    </Button>
  )
}

/** Flame plus the number of lessons finished so far. */
function LessonsChip() {
  const completed = read(days).length
  return (
    <Box border="accent" radius="sm" paddingX="sm" paddingY="xs">
      <Row gap="xs" align="center">
        <Box width={18} height={18} shrink={false}>
          <Image src="assets/icons/flame.png" alt="" size="full" fit="contain" />
        </Box>
        <Text weight="semibold">{String(completed)}</Text>
      </Row>
    </Box>
  )
}

function Credit({ image }: { image: CardImage }) {
  const { text, href } = image.credit
  return (
    <Row>
      <Text muted size="xs">
        {href ? `Image: ${text} · ` : `Image: ${text}`}
        {href ? <Link href={href}>source</Link> : null}
      </Text>
    </Row>
  )
}

function GoDeeper({ article, center = false }: { article: Article; center?: boolean }) {
  return (
    <Stack gap="xs" align={center ? 'center' : 'start'}>
      <Text muted size="xs" weight="semibold">{`GO DEEPER · ${article.source.toUpperCase()}`}</Text>
      <Text size="sm">
        <Link href={article.href}>{`${article.title} →`}</Link>
      </Text>
    </Stack>
  )
}

/** The picture on the front of a card, its credit, and the article it leads to. */
function CardPicture({ card }: { card: Card }) {
  if (!card.image) return null
  return (
    <Stack gap="xs" align="center">
      <Image src={card.image.src} alt={card.image.alt} size="md" fit="contain" rounded />
      <Credit image={card.image} />
      {card.article ? <GoDeeper article={card.article} center /> : null}
    </Stack>
  )
}

function Week() {
  const week = recentDays(read(days), new Date())
  return (
    <Grid columns={5} gap="sm">
      {week.map((d) => (
        <Box key={d.key} direction="column" gap="xs" align="center">
          <Box
            width="100%"
            height={40}
            radius="sm"
            align="center"
            justify="center"
            background={d.done ? 'accent' : 'none'}
            border={d.done ? false : 'accent'}
          >
            {d.done ? (
              <Box width={20} height={20}>
                <Image src="assets/icons/check.png" alt="Done" size="full" fit="contain" />
              </Box>
            ) : null}
          </Box>
          <Text size="xs" muted={!d.today} weight={d.today ? 'semibold' : 'regular'}>
            {d.label}
          </Text>
        </Box>
      ))}
    </Grid>
  )
}

// ——— 1. Course library ———

function CourseCard({ course }: { course: Course }) {
  const isCurrent = course.id === read(activeCourse)
  const badge = isCurrent ? (
    <Badge tone="accent">Current course</Badge>
  ) : course.status === 'playable' ? (
    <Badge>New</Badge>
  ) : course.status === 'capstone' ? (
    <Badge>Capstone</Badge>
  ) : (
    <Badge>Coming soon</Badge>
  )
  return (
    <Box border radius="md" padding="sm">
      <Row gap="md" align="start">
        <Box width={64} height={64} shrink={false} radius="sm" align="center" justify="center">
          <Image src={course.icon} alt="" size="full" fit="contain" />
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
            {course.status === 'playable' && !isCurrent ? (
              <Row>
                <Button variant="outline" size="sm" icon="play" onPress={() => openCourse(course.id)}>
                  Start course
                </Button>
              </Row>
            ) : null}
          </Stack>
        </Box>
      </Row>
    </Box>
  )
}

function Library() {
  const c = current()
  const learned = learnedIn(c, read(known))
  return (
    <Stack gap="lg">
      <Box border="accent" radius="lg" padding="md">
        <Stack gap="sm">
          <Row justify="between" align="center">
            <Heading level={2}>{c.title}</Heading>
            <LessonsChip />
          </Row>
          <Text muted size="sm">
            {c.blurb}
          </Text>
          <Progress label={`${learned} of ${c.cards.length} learned`} value={Math.round((learned / c.cards.length) * 100)} />
          <Row gap="sm">
            <Button variant="solid" tone="accent" icon="play" onPress={() => go('course')}>
              Continue
            </Button>
            <DictionaryButton />
          </Row>
        </Stack>
      </Box>

      <Stack gap="sm">
        <Row justify="between" align="center">
          <Heading level={3}>Top courses</Heading>
          <Button variant="ghost" size="sm" onPress={() => openPage('community')}>
            See community →
          </Button>
        </Row>
        <Stack gap="sm">
          {COURSES.map((x) => (
            <CourseCard key={x.id} course={x} />
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}

// ——— 2. Course dashboard ———

function Dashboard() {
  const c = current()
  const now = new Date()
  const finished = read(days)
  const streak = streakLength(finished, now)
  const doneToday = finished.includes(dayKey(now))
  const knownIds = read(known)
  const points = read(xp)
  const bite = pickBite(c, knownIds, finished.length)
  const unitId = currentUnit(c, knownIds)
  const cards = bite.cards.map((id) => getCard(c, id))
  const teaser = cards.find((x) => x.image)
  const reward = bite.cards.length * XP_PER_CARD + bite.questions.length * XP_PER_CORRECT + XP_PER_BITE
  return (
    <Stack gap="lg">
      <Row justify="between">
        <Button variant="ghost" size="sm" onPress={() => go('library')}>
          ‹ Courses
        </Button>
        <DictionaryButton />
      </Row>

      <Stack gap="md">
        <Row gap="md" align="center">
          <Box width={56} height={56} shrink={false}>
            <Image src="assets/icons/flame-large.png" alt="" size="full" fit="contain" />
          </Box>
          <Stack gap="xs">
            <Heading level={1}>{`${streak} day streak`}</Heading>
            <Row gap="xs">
              <Badge>{`LV ${level(points)}`}</Badge>
              <Badge>{`${points} XP`}</Badge>
            </Row>
          </Stack>
        </Row>
        <Week />
        <Text muted size="sm">
          {doneToday
            ? 'Done for today. Come back tomorrow to keep the streak.'
            : `Finish today's bite to reach ${streak + 1} ${streak === 0 ? 'day' : 'days'}.`}
        </Text>
      </Stack>

      <Box border radius="lg" padding="md">
        <Stack gap="md">
          <Row justify="between">
            <Text tone="accent" size="xs" weight="semibold">
              {bite.review ? "TODAY'S REVIEW · 5 MIN" : "TODAY'S BITE · 5 MIN"}
            </Text>
            <Text muted size="xs">{`+${reward} XP`}</Text>
          </Row>
          <Text muted size="xs" weight="semibold">
            {`${c.title.toUpperCase()} · ${unitLabel(c, bite.topic).toUpperCase()}`}
          </Text>
          <Text muted>{`${cards.length} cards, then a question on each: ${cards.map((x) => x.term).join(', ')}.`}</Text>
          {teaser?.image ? (
            <Stack gap="xs">
              <Image src={teaser.image.src} alt={teaser.image.alt} size="md" fit="contain" rounded />
              <Credit image={teaser.image} />
            </Stack>
          ) : null}
          <Row>
            <Button variant="solid" tone="accent" icon="play" onPress={startBite}>
              {doneToday ? 'Practice another bite' : 'Start'}
            </Button>
          </Row>
        </Stack>
      </Box>

      <List label="Your path">
        {c.units.map((u, i) => {
          const unitCards = c.cards.filter((x) => x.topic === u.id)
          const have = unitCards.filter((x) => knownIds.includes(x.id)).length
          const done = have === unitCards.length
          const here = u.id === unitId && !done
          return (
            <ListItem
              key={u.id}
              icon={done ? 'check' : here ? 'play' : 'flag'}
              title={`${i + 1}. ${u.label}`}
              description={`${have}/${unitCards.length} learned${here ? ' · you are here' : ''}`}
              current={here}
            />
          )
        })}
      </List>
    </Stack>
  )
}

// ——— 3–5. Lesson: flashcards, then one question per card ———

function LessonView() {
  const l = read(lesson)
  if (!l) return <EmptyState icon="book" title="No lesson in progress" />
  const total = l.bite.cards.length + l.bite.questions.length
  const onQuiz = l.step >= l.bite.cards.length
  const done = l.step + (l.checked ? 1 : 0)
  return (
    <Stack gap="lg">
      <Row gap="sm" align="center">
        <IconButton icon="close" label="Quit lesson" variant="ghost" onPress={() => go('course')} />
        <Box grow>
          <Progress label="Lesson progress" labelHidden value={Math.round((done / total) * 100)} />
        </Box>
        <Text size="sm" weight="semibold">{`${Math.min(l.step + 1, total)}/${total}`}</Text>
      </Row>
      {onQuiz ? <QuizStep lesson={l} /> : <CardStep lesson={l} />}
    </Stack>
  )
}

function CardStep({ lesson: l }: { lesson: Lesson }) {
  const c = getCourse(l.bite.courseId)
  const card = getCard(c, l.bite.cards[l.step])
  const isPractice = Boolean(card.front)
  return (
    <Box border="accent" radius="lg" padding="lg">
      <Stack gap="lg">
        <Row justify="between">
          <Text muted size="xs" weight="semibold">
            {l.flipped ? (isPractice ? "WHAT'S GOING ON" : 'DEFINITION') : l.bite.review ? 'REVIEW' : c.frontLabel}
          </Text>
          <Badge>{unitLabel(c, card.topic)}</Badge>
        </Row>
        {l.flipped ? (
          <Stack gap="md">
            <Heading level={2}>{card.answer ?? card.term}</Heading>
            <Text>{card.definition}</Text>
            <Callout tone="accent" icon="lightbulb" title={isPractice ? 'Design move' : "Designer's lens"}>
              <Text>{card.lens}</Text>
            </Callout>
            {card.article && !card.image ? <GoDeeper article={card.article} /> : null}
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
          <Stack gap={card.front ? 'sm' : 'lg'} align="center">
            <Heading level={1}>{card.term}</Heading>
            {/* Orca's Text has no centering for wrapped lines; EmptyState centers its title. */}
            {card.front ? <EmptyState title={card.front} /> : null}
            <CardPicture card={card} />
            <Text muted>{isPractice ? 'Guess what’s going on, then flip.' : 'Guess what it means, then flip.'}</Text>
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
  const index = l.step - l.bite.cards.length
  const q = l.bite.questions[index]
  const correct = l.choice === String(q.answer)
  const last = index === l.bite.questions.length - 1
  return (
    <Stack gap="md">
      <Text tone="accent" size="xs" weight="semibold">
        {`QUICK QUIZ · ${index + 1} OF ${l.bite.questions.length}`}
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
          <Row>
            <Button variant="solid" tone={correct ? 'success' : 'accent'} icon="next" onPress={nextQuestion}>
              {last ? 'See results' : 'Next question'}
            </Button>
          </Row>
        </Stack>
      ) : (
        <Row>
          <Button variant="solid" tone="accent" icon="check" disabled={l.choice === ''} onPress={checkAnswer}>
            Check answer
          </Button>
        </Row>
      )}
    </Stack>
  )
}

// ——— 6. Bite complete ———

function Complete() {
  const l = read(lesson)
  const c = current()
  const streak = streakLength(read(days), new Date())
  const next = pickBite(c, read(known), read(days).length)
  return (
    <Stack gap="lg" align="center">
      <Heading level={1}>Bite complete!</Heading>
      <Box width={140} height={140}>
        <Image src="assets/icons/flame-large.png" alt="Streak flame" size="full" fit="contain" />
      </Box>
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
            <Text muted size="xs">QUIZ</Text>
            <Heading level={2}>{l ? `${l.correct}/${l.bite.questions.length}` : '–'}</Heading>
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
          <Text>{`${next.cards.map((id) => getCard(c, id).term).join(', ')}. Come back to keep the streak alive.`}</Text>
        </Stack>
      </Box>
      <Box width="100%">
        <Stack gap="sm">
          <Row>
            <Button variant="solid" tone="accent" onPress={() => go('course')}>
              Back to my path
            </Button>
          </Row>
          <Row gap="sm">
            <Button variant="outline" icon="globe" onPress={() => openPage('community')}>
              Share
            </Button>
            <Button variant="ghost" icon="book" onPress={openDictionary}>
              Dictionary
            </Button>
          </Row>
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
        <Badge>{`${TERMS.filter((t) => knownIds.includes(t.id)).length}/${TERMS.length} learned`}</Badge>
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
            <Collapsible key={t.id} title={knownIds.includes(t.id) ? `${t.term} ✓` : t.term} description={topicLabel(t.topic)}>
              <Stack gap="sm">
                <Text>{t.definition}</Text>
                <Text muted size="sm">{`Designer's lens: ${t.lens}`}</Text>
                {ARTICLES[t.id] ? <GoDeeper article={ARTICLES[t.id]} /> : null}
              </Stack>
            </Collapsible>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

// ——— Community (empty until sharing goes live) ———

function Community() {
  return (
    <Stack gap="md">
      <Row justify="between">
        <Button variant="ghost" size="sm" onPress={() => go(read(returnTo))}>
          ‹ Back
        </Button>
      </Row>
      <Heading level={2}>Community</Heading>
      <EmptyState
        icon="globe"
        title="The community is on its way"
        description="Soon you'll see other designers' streaks, points and what they learned, and share your own bites here."
      >
        <Button variant="solid" tone="accent" icon="book" onPress={() => go('library')}>
          Keep learning
        </Button>
      </EmptyState>
    </Stack>
  )
}

export default function Panel() {
  switch (read(view)) {
    case 'course':
      return <Dashboard />
    case 'lesson':
      return <LessonView />
    case 'complete':
      return <Complete />
    case 'dictionary':
      return <Dictionary />
    case 'community':
      return <Community />
    default:
      return <Library />
  }
}
