// Streaks, XP and picking today's bite. Pure functions so they are easy to test.
import type { Question } from './content'
import { hash, type Card, type PlayableCourse } from './courses'

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
  courseId: string
  cards: string[]
  questions: Question[]
  topic: string
  review: boolean
}

/** The unit to work on: the first one with cards left to learn. */
export function currentUnit(c: PlayableCourse, known: readonly string[]): string {
  const k = new Set(known)
  return c.units.find((u) => c.cards.some((card) => card.topic === u.id && !k.has(card.id)))?.id ?? c.units[0].id
}

/** Today's bite: the next unlearned cards in path order, then one question per card. */
export function pickBite(c: PlayableCourse, known: readonly string[], dayIndex = 0): Bite {
  const k = new Set(known)
  const fresh = c.cards.filter((card) => !k.has(card.id))
  const review = fresh.length === 0
  const pool = review ? rotate(c.cards, (dayIndex * CARDS_PER_BITE) % c.cards.length) : fresh
  const cards = pool.slice(0, CARDS_PER_BITE)
  const ids = cards.map((card) => card.id)
  // Wrong answers may only use cards the player has met: today's cards and ones already learned.
  const seen = [...new Set([...ids, ...known.filter((id) => c.cards.some((card) => card.id === id))])]
  const questions = cards.map((card, i) => c.question(card, seen, hash(card.id) * 2 + i))
  return { courseId: c.id, cards: ids, questions, topic: cards[0].topic, review }
}

function rotate<T>(list: readonly T[], by: number): T[] {
  return [...list.slice(by), ...list.slice(0, by)]
}

export function card(c: PlayableCourse, id: string): Card {
  const found = c.cards.find((x) => x.id === id)
  if (!found) throw new Error(`Unknown card ${id}`)
  return found
}
