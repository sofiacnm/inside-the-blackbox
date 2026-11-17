// The course library and the two playable courses: Inside the Black Box (the vocabulary) and
// AI in Practice (real situations). Each bite is three cards, then one quiz question per card.
import { QUESTIONS, TERMS, TOPICS, type Question, type Term, type Topic } from './content'
import { ARTICLES, CARD_IMAGES, type Article, type CardImage } from './media'
import { PRACTICE_CARDS, PRACTICE_UNITS, type PracticeCard } from './practice'

export type { Article, CardImage } from './media'

export interface Course {
  id: string
  title: string
  blurb: string
  icon: string
  status: 'playable' | 'soon' | 'capstone'
}

export const BLACK_BOX_ID = 'black-box'
export const PRACTICE_ID = 'practice'

export const COURSES: Course[] = [
  { id: BLACK_BOX_ID, title: 'Inside the Black Box', blurb: 'The language of AI, one card a day.', icon: 'assets/icons/box.png', status: 'playable' },
  { id: PRACTICE_ID, title: 'AI in Practice', blurb: 'Real design situations, and the idea behind each.', icon: 'assets/icons/flow.png', status: 'playable' },
  { id: 'tokens', title: 'Tokens & Text', blurb: 'How a model reads a sentence', icon: 'assets/icons/tokens.png', status: 'soon' },
  { id: 'matrices', title: 'Matrices & Vectors', blurb: 'The math behind meaning', icon: 'assets/icons/matrix.png', status: 'soon' },
  { id: 'neural', title: 'Neural Networks', blurb: 'Layers, weights and learning', icon: 'assets/icons/neural.png', status: 'soon' },
  { id: 'safety', title: 'AI Safety', blurb: 'Alignment, red teams, guardrails', icon: 'assets/icons/shield.png', status: 'soon' },
  { id: 'probability', title: 'Probability', blurb: 'Why one prompt gives many answers', icon: 'assets/icons/dice.png', status: 'soon' },
  { id: 'binary', title: 'Binary & Data', blurb: 'How computers store everything', icon: 'assets/icons/binary.png', status: 'soon' },
  { id: 'tiny-model', title: 'Build a Tiny Model', blurb: 'Capstone: put it all together', icon: 'assets/icons/lock.png', status: 'capstone' },
]

/** A flashcard as the lesson shows it. */
export interface Card extends Term {
  /** Practice cards show a situation on the front; vocabulary cards show the term. */
  front?: string
  /** Practice cards name the concept on the back. */
  answer?: string
  image?: CardImage
  article?: Article
}

export interface PlayableCourse {
  id: string
  title: string
  blurb: string
  /** Label above the front of a card, e.g. "NEW TERM". */
  frontLabel: string
  units: Topic[]
  cards: Card[]
  /** One question about this card. `seen` are other cards' ids the player has met (for wrong answers). */
  question(card: Card, seen: readonly string[], seed: number): Question
}

const withMedia = (card: Term, articleKey = card.id): Card => ({
  ...card,
  image: CARD_IMAGES[card.id],
  article: ARTICLES[articleKey],
})

/** First sentence of a definition, short enough for a quiz option. */
export function firstSentence(text: string): string {
  const end = text.search(/[.!?](\s|$)/)
  return end === -1 ? text : text.slice(0, end + 1)
}

/** Deterministic shuffle so a question keeps its order across reloads. */
export function shuffle<T>(list: readonly T[], seed: number): T[] {
  const out = [...list]
  let s = seed >>> 0 || 1
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

const blackBoxCards = TERMS.map((t) => withMedia(t))

/**
 * Vocabulary quiz: alternate "which term matches this definition?" and "what does this term mean?".
 * Wrong answers come only from cards the player has already seen, so nothing is unfamiliar.
 */
function vocabularyQuestion(card: Card, seen: readonly string[], seed: number): Question {
  let pool = seen.filter((id) => id !== card.id).map((id) => blackBoxCards.find((c) => c.id === id)!).filter(Boolean)
  // Only when nothing else has been seen (a lone last card): fall back to the same unit.
  if (pool.length === 0) pool = blackBoxCards.filter((c) => c.topic === card.topic && c.id !== card.id)
  const distractors = shuffle(pool, seed).slice(0, 3)
  const askTerm = seed % 2 === 0
  const options = shuffle([card, ...distractors], seed + 7)
  return {
    id: `v-${card.id}`,
    topic: card.topic,
    prompt: askTerm
      ? `Which term matches this definition? "${firstSentence(card.definition)}"`
      : `What does "${card.term}" mean?`,
    options: options.map((c) => (askTerm ? c.term : firstSentence(c.definition))),
    answer: options.indexOf(card),
    explain: `${card.term}: ${card.definition}`,
  }
}

const practiceCards: Card[] = PRACTICE_CARDS.map((c: PracticeCard) => withMedia(c, c.concept))

export const PLAYABLE: Record<string, PlayableCourse> = {
  [BLACK_BOX_ID]: {
    id: BLACK_BOX_ID,
    title: 'Inside the Black Box',
    blurb: `The language of AI, one card a day. ${TERMS.length} terms · ${TOPICS.length} units.`,
    frontLabel: 'NEW TERM',
    units: TOPICS,
    cards: blackBoxCards,
    question: vocabularyQuestion,
  },
  [PRACTICE_ID]: {
    id: PRACTICE_ID,
    title: 'AI in Practice',
    blurb: `Real design situations, and the idea behind each. ${PRACTICE_CARDS.length} situations · ${PRACTICE_UNITS.length} units.`,
    frontLabel: 'SITUATION',
    units: PRACTICE_UNITS,
    cards: practiceCards,
    question: (card) => {
      const practice = PRACTICE_CARDS.find((c) => c.id === card.id)!
      return QUESTIONS.find((q) => q.id === practice.questionId)!
    },
  },
}

export function course(id: string): PlayableCourse {
  return PLAYABLE[id] ?? PLAYABLE[BLACK_BOX_ID]
}

export function unitLabel(c: PlayableCourse, unitId: string): string {
  return c.units.find((u) => u.id === unitId)?.label ?? unitId
}
