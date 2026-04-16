export const VIEWER_TYPES = [
  { id: 'нормис',      symbol: '◎', desc: 'Смотрю что все смотрят' },
  { id: 'нефор',       symbol: '◈', desc: 'Инди, артхаус, не мейнстрим' },
  { id: 'нишевый',     symbol: '▣', desc: 'Кино — это искусство' },
  { id: 'сериалодрот', symbol: '▦', desc: 'Залипаю в сериалы' },
  { id: 'анимешник',   symbol: '✦', desc: 'Аниме — это жизнь' },
  { id: 'забивной',    symbol: '◌', desc: 'Включаю фоном, без претензий' },
]

export const VIEWER_TYPE_SYMBOL: Record<string, string> = Object.fromEntries(
  VIEWER_TYPES.map(({ id, symbol }) => [id, symbol])
)
