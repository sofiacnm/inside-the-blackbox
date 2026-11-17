// Streaks, XP and picking today's bite. Pure functions so they are easy to test.
import { QUESTIONS, TERMS, TOPICS, type Question, type Term } from './content'

export const CARDS_PER_BITE = 3
export const XP_PER_CARD = 5
export const XP_PER_CORRECT = 10
export const XP_PER_BITE = 15

/** A local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, delta: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + delta)
  return next
}

/** Days in a row with a finished bite, ending today (or yesterday, if today is still open). */
export function streakLength(days: readonly string[], now: Date): number {
  const done = new Set(days)
  let cursor = done.has(dayKey(now)) ? now : addDays(now, -1)
  let count = 0
  while (done.has(dayKey(cursor))) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

/** Adds today to the finished days, keeping the list short and unique. */
export function recordDay(days: readonly string[], now: Date): string[] {
  const today = dayKey(now)
  return [...days.filter((d) => d !== today), today].sort().slice(-90)
}

export interface WeekDay {
  key: string
  label: string
  done: boolean
  today: boolean
}

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** Today, then the days before it: reads left to right as the streak runs back in time. */
export function recentDays(days: readonly string[], now: Date, count = 5): WeekDay[] {
  const done = new Set(days)
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(now, -i)
    const key = dayKey(date)
    return { key, label: i === 0 ? 'Today' : LETTERS[date.getDay()], done: done.has(key), today: i === 0 }
  })
}

export function level(xp: number): number {
  return Math.floor(xp / 100) + 1
}

export interface Bite {
  cards: string[]
  questionId: string
  topic: string
  review: boolean
}

/** The unit to work on: the first one with terms left to learn. */
export function currentTopic(known: readonly string[]): string {
  const k = new Set(known)
  return TOPICS.find((t) => TERMS.some((term) => term.topic === t.id && !k.has(term.id)))?.id ?? TOPICS[0].id
}

/** Today's bite: the next unlearned cards in path order, then one quiz question. */
export function pickBite(known: readonly string[], solved: readonly string[], dayIndex = 0): Bite {
  const k = new Set(known)
  const fresh = TERMS.filter((t) => !k.has(t.id))
  const review = fresh.length === 0
  const pool = review ? rotate(TERMS, (dayIndex * CARDS_PER_BITE) % TERMS.length) : fresh
  const cards = pool.slice(0, CARDS_PER_BITE)
  const topic = cards[0].topic
  const s = new Set(solved)
  const inTopic = QUESTIONS.filter((q) => q.topic === topic)
  const question = inTopic.find((q) => !s.has(q.id)) ?? inTopic[dayIndex % inTopic.length] ?? QUESTIONS[0]
  return { cards: cards.map((c) => c.id), questionId: question.id, topic, review }
}

function rotate<T>(list: readonly T[], by: number): T[] {
  return [...list.slice(by), ...list.slice(0, by)]
}

export function term(id: string): Term {
  const found = TERMS.find((t) => t.id === id)
  if (!found) throw new Error(`Unknown term ${id}`)
  return found
}

export function question(id: string): Question {
  const found = QUESTIONS.find((q) => q.id === id)
  if (!found) throw new Error(`Unknown question ${id}`)
  return found
}
