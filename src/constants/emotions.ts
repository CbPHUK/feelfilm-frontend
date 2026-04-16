// Зеркало backend/src/constants/emotions.ts

export const MOOD_BEFORE_TAGS = [
  'грусть',
  'тревога',
  'скука',
  'усталость',
  'злость',
  'пустота',
  'одиночество',
  'радость',
  'влюблённость',
  'ностальгия',
  'стресс',
  'апатия',
] as const

export const EFFECT_AFTER_TAGS = [
  'вдохновил',
  'успокоил',
  'заставил плакать',
  'рассмешил',
  'напугал',
  'удивил',
  'задумал',
  'взорвал мозг',
  'согрел',
  'опустошил',
  'зарядил энергией',
  'не отпускает',
] as const

export const ATMOSPHERE_TAGS = [
  'тёплый',
  'мрачный',
  'напряжённый',
  'красивый',
  'странный',
  'громкий',
  'тихий',
  'медленный',
  'стремительный',
  'смешной',
  'страшный',
  'романтичный',
  'философский',
  'жестокий',
] as const

export type MoodBeforeTag = (typeof MOOD_BEFORE_TAGS)[number]
export type EffectAfterTag = (typeof EFFECT_AFTER_TAGS)[number]
export type AtmosphereTag = (typeof ATMOSPHERE_TAGS)[number]
