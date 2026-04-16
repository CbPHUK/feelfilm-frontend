import { createContext, useContext, useState } from 'react'

type Lang = 'ru' | 'en'

const T = {
  ru: {
    feed: 'Лента', search: 'Поиск', share: 'Поделиться', settings: 'Настройки', books: 'Книги',
    all: 'Всё', movies: 'Фильмы', series: 'Сериалы', anime: 'Аниме',
    nowInFeed: 'Сейчас в ленте',
    howAreYou: 'Как тебе сейчас?', findByMood: 'Выбери ощущения — найдём под настроение',
    myMood: 'Моё настроение', wantToFeel: 'Хочу почувствовать', atmosphere: 'Атмосфера',
    find: 'Найти',
    noResults: 'Ничего не нашли — другие теги?',
    whatWatched: 'Что смотрел?', whoAreYou: 'Кто ты как зритель?',
    whatBefore: 'С чем ты пришёл?', whatAfter: 'Что сделал фильм?',
    whatAtmo: 'Какая атмосфера?', onePhrase: 'Одна фраза',
    searchOrAdd: 'Поищи или добавь вручную', contextHint: 'Чтобы читатели понимали твой контекст',
    moodHint: 'Настроение перед просмотром', effectHint: 'С каким чувством ты ушёл',
    atmoHint: 'Как бы ты описал его характер', noteHint: 'Не рецензия — просто личное (необязательно)',
    next: 'Дальше', skip: 'Пропустить', shareBtn: 'Поделиться', saving: 'Сохраняем...',
    addTitle: 'Добавить «', noReviews: 'Пока нет отзывов', beFirst: 'Будь первым.',
    back: '← Назад', shareEmotions: 'Поделиться своими эмоциями',
    emotionPortrait: 'Эмоциональный портрет',
    cameWith: 'С чем приходили', leftWith: 'Что уносили', vibe: 'Атмосфера',
    cameWithShort: 'пришёл с', leftWithShort: 'ушёл с', vibeShort: 'атмосфера',
    theme: 'Тема', language: 'Язык', profile: 'Профиль',
    darkMode: 'Тёмная', lightMode: 'Светлая',
    yourName: 'Твоё имя', namePlaceholder: 'Как тебя зовут?', nameHint: 'Покажется в твоих отзывах',
    start: 'Начать', authError: 'Ошибка авторизации — обнови страницу',
    errNoFilm: 'Фильм не выбран', errGeneric: 'Что-то пошло не так, попробуй ещё раз', authorizing: 'Авторизация...',
    filmNotFound: 'Не найдено', searching: '...', anon: 'Аноним',
    editReview: 'Изменить свой отзыв', deleteReview: 'Удалить', reviewDeleted: 'Отзыв удалён',
    moodBefore: 'Настроение до', effectAfter: 'Эффект после',
    placeholderNote: 'Смотрел в 2 ночи и не мог остановиться...',
    notIntro1Title: 'Не оценки.\nОщущения.', notIntro1: 'Забудь про звёзды. Здесь описывают что почувствовали — до и после просмотра.',
    notIntro2Title: 'Найди под\nнастроение.', notIntro2: 'Грустишь? Устал? Хочешь вдохновиться? Выбери ощущение — мы найдём.',
    notIntro3Title: 'Передай\nэмоцию.', notIntro3: 'Кто-то сейчас чувствует то же, что ты. Твой честный отзыв может помочь.',
  },
  en: {
    feed: 'Feed', search: 'Search', share: 'Share', settings: 'Settings', books: 'Books',
    all: 'All', movies: 'Movies', series: 'Series', anime: 'Anime',
    nowInFeed: 'Now in feed',
    howAreYou: 'How are you feeling?', findByMood: 'Pick emotions — we\'ll find the right film',
    myMood: 'My mood', wantToFeel: 'I want to feel', atmosphere: 'Atmosphere',
    find: 'Find',
    noResults: 'Nothing found — try other tags?',
    whatWatched: 'What did you watch?', whoAreYou: 'Who are you as a viewer?',
    whatBefore: 'What did you bring?', whatAfter: 'What did the film do?',
    whatAtmo: 'What\'s the atmosphere?', onePhrase: 'One phrase',
    searchOrAdd: 'Search or add manually', contextHint: 'So readers understand your perspective',
    moodHint: 'Mood before watching', effectHint: 'Feeling you left with',
    atmoHint: 'How would you describe its character', noteHint: 'Not a review — just personal (optional)',
    next: 'Next', skip: 'Skip', shareBtn: 'Share', saving: 'Saving...',
    addTitle: 'Add "', noReviews: 'No reviews yet', beFirst: 'Be the first.',
    back: '← Back', shareEmotions: 'Share your emotions',
    emotionPortrait: 'Emotional portrait',
    cameWith: 'Came with', leftWith: 'Left with', vibe: 'Vibe',
    cameWithShort: 'came with', leftWithShort: 'left with', vibeShort: 'vibe',
    theme: 'Theme', language: 'Language', profile: 'Profile',
    darkMode: 'Dark', lightMode: 'Light',
    yourName: 'Your name', namePlaceholder: 'What\'s your name?', nameHint: 'Shown on your reviews',
    start: 'Start', authError: 'Auth error — please refresh',
    errNoFilm: 'No film selected', errGeneric: 'Something went wrong, try again', authorizing: 'Authorizing...',
    filmNotFound: 'Not found', searching: '...', anon: 'Anonymous',
    editReview: 'Edit my review', deleteReview: 'Delete', reviewDeleted: 'Review deleted',
    moodBefore: 'Mood before', effectAfter: 'Effect after',
    placeholderNote: 'Watched at 2am and couldn\'t stop...',
    notIntro1Title: 'Not ratings.\nFeelings.', notIntro1: 'Forget stars. Here people describe what they felt — before and after.',
    notIntro2Title: 'Find by\nmood.', notIntro2: 'Sad? Tired? Need inspiration? Pick a feeling — we\'ll find it.',
    notIntro3Title: 'Pass the\nemotion.', notIntro3: 'Someone feels what you felt. Your honest review can help them.',
  },
} as const

export type Translations = typeof T['ru'] | typeof T['en']

export function fmtResults(n: number, lang: Lang): string {
  if (lang === 'ru') return `${n} ${n===1?'результат':n<5?'результата':'результатов'}`
  return `${n} result${n===1?'':'s'}`
}

export function fmtReviews(n: number, lang: Lang): string {
  if (lang === 'ru') return `${n} ${n===1?'отзыв':n<5?'отзыва':'отзывов'}`
  return `${n} review${n===1?'':'s'}`
}

interface LangContextValue {
  lang: Lang
  t: Translations
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextValue>({ lang: 'ru', t: T.ru, setLang: () => {} })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('ff_lang') as Lang) ?? 'ru'
  )

  const setLang = (l: Lang) => {
    localStorage.setItem('ff_lang', l)
    setLangState(l)
  }

  return (
    <LangContext.Provider value={{ lang, t: T[lang], setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
