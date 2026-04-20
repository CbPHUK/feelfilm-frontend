import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client'
import { MOOD_BEFORE_TAGS, EFFECT_AFTER_TAGS, ATMOSPHERE_TAGS } from '../constants/emotions'

// ── Дизайн-токены (paper/ink тема) ───────────────────────────────────────────
const T = {
  paper:     '#e9e2cf',
  paperSoft: '#efe7d2',
  paperDeep: '#ddd3bb',
  ink:       '#1b1d2a',
  inkSoft:   'rgba(27,29,42,0.62)',
  inkMute:   'rgba(27,29,42,0.40)',
  rule:      'rgba(27,29,42,0.15)',
  red:       '#b85c3c',
  blue:      '#2b4fc2',
  green:     '#2d7a4a',
  orange:    '#c47a1e',
  mono:      '"JetBrains Mono", ui-monospace, monospace',
  sans:      '"Inter", -apple-system, system-ui, sans-serif',
  display:   '"Unbounded", "Inter", sans-serif',
}

const TYPE_LABEL: Record<string, string> = { movie: 'Фильм', series: 'Сериал', anime: 'Аниме', book: 'Книга' }
const TABS = ['dashboard', 'reviews', 'users', 'tags'] as const
type Tab = typeof TABS[number]
const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Дашборд',
  reviews:   'Отзывы',
  users:     'Пользователи',
  tags:      'Теги',
}

// ── Типы ─────────────────────────────────────────────────────────────────────
interface Stats {
  totalFilms: number; totalReviews: number; totalUsers: number
  reviewsLast7: number; reviewsLast30: number
  usersLast7: number; usersLast30: number
  taggedFilms: number; userTagged: number; heuristicTagged: number; adminTagged: number
  bannedUsers: number
  activity: { date: string; count: number }[]
}

interface AdminReview {
  id: number
  personalNote: string | null
  moodBefore: string[]; effectAfter: string[]; atmosphere: string[]
  viewerType: string | null
  likes: number
  createdAt: string
  user: { id: number; firstName: string; username: string | null; email: string | null; banned: boolean }
  film: { id: number; title: string; type: string; posterUrl: string | null }
}

interface AdminUser {
  id: number; firstName: string; username: string | null; email: string | null
  banned: boolean; bannedAt: string | null; bannedReason: string | null
  createdAt: string
  _count: { reviews: number }
}

interface EmotionTag {
  id: number; filmId: number; category: string; tag: string; confidence: number; source: string
}
interface AdminFilm {
  id: number; title: string; year?: number; type: string; posterUrl?: string
  emotionTags: EmotionTag[]; _count: { reviews: number }
}

// ── Вспомогательные компоненты ────────────────────────────────────────────────

function StatCard({ value, label, sub, color }: { value: number | string; label: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: T.paperDeep, padding: '14px 18px', borderRadius: 4, minWidth: 100 }}>
      <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: color ?? T.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: T.inkMute, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: T.inkMute, marginTop: 2, fontFamily: T.mono }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ activity }: { activity: { date: string; count: number }[] }) {
  const max = Math.max(...activity.map(a => a.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {activity.map(a => (
        <div key={a.date} title={`${a.date}: ${a.count}`} style={{
          flex: 1, background: T.ink,
          height: `${Math.max(4, Math.round((a.count / max) * 48))}px`,
          borderRadius: 2, opacity: 0.15 + (a.count / max) * 0.85,
          cursor: 'default',
        }} />
      ))}
    </div>
  )
}

function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  const nums = Array.from({ length: Math.min(pages, 8) }, (_, i) => i + 1)
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 20, justifyContent: 'center' }}>
      {page > 1 && <Btn label="←" onClick={() => onChange(page - 1)} />}
      {nums.map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          width: 30, height: 30,
          border: `1px solid ${p === page ? T.ink : T.rule}`,
          background: p === page ? T.ink : 'transparent',
          color: p === page ? T.paper : T.ink,
          cursor: 'pointer', fontFamily: T.mono, fontSize: 11, borderRadius: 3,
        }}>{p}</button>
      ))}
      {page < pages && <Btn label="→" onClick={() => onChange(page + 1)} />}
    </div>
  )
}

function Btn({ label, onClick, danger, small }: { label: string; onClick: () => void; danger?: boolean; small?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: small ? '4px 10px' : '7px 14px',
      background: danger ? T.red : T.ink, color: T.paper, border: 'none',
      cursor: 'pointer', fontFamily: T.sans, fontSize: small ? 11 : 12, borderRadius: 3,
    }}>{label}</button>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? 'Поиск...'}
      style={{
        padding: '7px 12px', border: `1px solid ${T.rule}`,
        background: 'transparent', color: T.ink, fontFamily: T.sans, fontSize: 13,
        borderRadius: 3, outline: 'none', minWidth: 200,
      }} />
  )
}

// ── ВКЛАДКА: Дашборд ─────────────────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.stats().then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (!stats) return <Error msg="Не удалось загрузить статистику" />

  return (
    <div>
      <Section title="Общее">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <StatCard value={stats.totalUsers}   label="Пользователей" sub={`+${stats.usersLast7} за 7 дней`} />
          <StatCard value={stats.totalReviews} label="Отзывов"       sub={`+${stats.reviewsLast7} за 7 дней`} />
          <StatCard value={stats.totalFilms}   label="Произведений" />
          <StatCard value={stats.bannedUsers}  label="Забанено" color={stats.bannedUsers > 0 ? T.red : T.inkMute} />
        </div>
      </Section>

      <Section title="Активность за 14 дней">
        <MiniBar activity={stats.activity} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.inkMute }}>{stats.activity[0]?.date}</span>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.inkMute }}>{stats.activity[stats.activity.length - 1]?.date}</span>
        </div>
      </Section>

      <Section title="Эмоциональная разметка">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <StatCard value={stats.taggedFilms}     label="Размечено фильмов" />
          <StatCard value={stats.userTagged}      label="User-тегов"       color={T.green} />
          <StatCard value={stats.heuristicTagged} label="Heuristic-тегов"  color={T.blue} />
          <StatCard value={stats.adminTagged}     label="Admin-тегов"      color={T.orange} />
        </div>
      </Section>

      <Section title="Отзывы за периоды">
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard value={stats.reviewsLast7}  label="за 7 дней" />
          <StatCard value={stats.reviewsLast30} label="за 30 дней" />
        </div>
      </Section>
    </div>
  )
}

// ── ВКЛАДКА: Отзывы ───────────────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews]   = useState<AdminReview[]>([])
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [page, setPage]         = useState(1)
  const [sortBy, setSortBy]     = useState('newest')
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = useCallback(async (p = 1, sort = sortBy) => {
    setLoading(true)
    try {
      const res = await api.admin.reviews({ page: p, sortBy: sort })
      setReviews(res.reviews as AdminReview[])
      setTotal(res.total); setPages(res.pages); setPage(p)
    } finally { setLoading(false) }
  }, [sortBy])

  useEffect(() => { load() }, []) // eslint-disable-line

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return
    await api.admin.deleteReview(id)
    setReviews(prev => prev.filter(r => r.id !== id))
    setTotal(t => t - 1)
  }

  const handleBanUser = async (userId: number, userName: string) => {
    const reason = prompt(`Причина бана для ${userName}:`) ?? ''
    if (reason === null) return
    await api.admin.banUser(userId, reason)
    setReviews(prev => prev.map(r =>
      r.user.id === userId ? { ...r, user: { ...r.user, banned: true } } : r
    ))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); load(1, e.target.value) }}
          style={{ padding: '7px 10px', border: `1px solid ${T.rule}`, background: T.paper, fontFamily: T.sans, fontSize: 12, borderRadius: 3 }}>
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
        </select>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute, marginLeft: 'auto' }}>
          {total} отзывов
        </span>
      </div>

      {loading ? <Loading /> : (
        <div>
          {reviews.map(r => (
            <div key={r.id} style={{
              borderBottom: `1px solid ${T.rule}`, padding: '12px 0',
              background: r.user.banned ? 'rgba(184,92,60,0.04)' : 'transparent',
            }}>
              {/* Шапка */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {r.film.posterUrl && (
                  <img src={r.film.posterUrl} style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} alt="" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.film.title}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMute }}>{TYPE_LABEL[r.film.type]}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMute, marginLeft: 'auto' }}>
                      #{r.id} · {new Date(r.createdAt).toLocaleDateString('ru')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: r.user.banned ? T.red : T.inkSoft }}>
                      {r.user.firstName}{r.user.username ? ` @${r.user.username}` : ''}
                      {r.user.banned && ' 🚫'}
                    </span>
                    {r.likes > 0 && (
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMute }}>♥ {r.likes}</span>
                    )}
                    {r.viewerType && (
                      <span style={{ fontSize: 10, color: T.inkMute, background: T.paperDeep, padding: '2px 6px', borderRadius: 2 }}>
                        {r.viewerType}
                      </span>
                    )}
                  </div>
                  {/* Теги */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6 }}>
                    {r.moodBefore.map(t => <Tag key={t} label={t} color={T.red} />)}
                    {r.effectAfter.map(t => <Tag key={t} label={t} color={T.blue} />)}
                    {r.atmosphere.map(t => <Tag key={t} label={t} />)}
                  </div>
                  {/* Личная заметка */}
                  {r.personalNote && (
                    <div
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      style={{ marginTop: 6, fontSize: 12, color: T.inkSoft, cursor: 'pointer' }}
                    >
                      {expanded === r.id ? r.personalNote : `"${r.personalNote.slice(0, 80)}${r.personalNote.length > 80 ? '…"' : '"'}`}
                    </div>
                  )}
                </div>
                {/* Действия */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {!r.user.banned && (
                    <Btn small label="Бан" onClick={() => handleBanUser(r.user.id, r.user.firstName)} danger />
                  )}
                  <Btn small label="Удалить" onClick={() => handleDelete(r.id)} danger />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={p => load(p)} />
    </div>
  )
}

// ── ВКЛАДКА: Пользователи ────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]   = useState<AdminUser[]>([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [onlyBanned, setOnlyBanned] = useState(false)
  const [loading, setLoading]       = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (p = 1, s = search, banned = onlyBanned) => {
    setLoading(true)
    try {
      const res = await api.admin.users({ page: p, search: s || undefined, banned: banned || undefined })
      setUsers(res.users as AdminUser[]); setTotal(res.total); setPages(res.pages); setPage(p)
    } finally { setLoading(false) }
  }, [search, onlyBanned])

  useEffect(() => { load() }, []) // eslint-disable-line

  const handleSearch = (v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(1, v, onlyBanned), 400)
  }

  const handleBan = async (user: AdminUser) => {
    const reason = prompt(`Причина бана для ${user.firstName}:`)
    if (reason === null) return
    await api.admin.banUser(user.id, reason)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned: true, bannedReason: reason, bannedAt: new Date().toISOString() } : u))
  }

  const handleUnban = async (user: AdminUser) => {
    await api.admin.unbanUser(user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned: false, bannedReason: null, bannedAt: null } : u))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={handleSearch} placeholder="Имя, email, @username..." />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: T.inkSoft }}>
          <input type="checkbox" checked={onlyBanned} onChange={e => { setOnlyBanned(e.target.checked); load(1, search, e.target.checked) }} />
          Только забаненные
        </label>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute, marginLeft: 'auto' }}>{total} юзеров</span>
      </div>

      {loading ? <Loading /> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.rule}` }}>
              {['ID', 'Имя', 'Email', 'Отзывов', 'Регистрация', 'Статус', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontFamily: T.mono, fontSize: 10, color: T.inkMute, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${T.rule}`, background: u.banned ? 'rgba(184,92,60,0.04)' : 'transparent' }}>
                <td style={{ padding: '8px', fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{u.id}</td>
                <td style={{ padding: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{u.firstName}</div>
                  {u.username && <div style={{ color: T.inkMute, fontSize: 11 }}>@{u.username}</div>}
                </td>
                <td style={{ padding: '8px', color: T.inkSoft }}>{u.email ?? '—'}</td>
                <td style={{ padding: '8px', fontFamily: T.mono, textAlign: 'center' }}>{u._count.reviews}</td>
                <td style={{ padding: '8px', fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{new Date(u.createdAt).toLocaleDateString('ru')}</td>
                <td style={{ padding: '8px' }}>
                  {u.banned ? (
                    <div>
                      <span style={{ color: T.red, fontSize: 11, fontWeight: 600 }}>Забанен</span>
                      {u.bannedReason && <div style={{ fontSize: 10, color: T.inkMute, maxWidth: 120 }}>{u.bannedReason}</div>}
                    </div>
                  ) : (
                    <span style={{ color: T.green, fontSize: 11 }}>Активен</span>
                  )}
                </td>
                <td style={{ padding: '8px' }}>
                  {u.banned
                    ? <Btn small label="Разбанить" onClick={() => handleUnban(u)} />
                    : <Btn small label="Забанить" danger onClick={() => handleBan(u)} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pagination page={page} pages={pages} onChange={p => load(p)} />
    </div>
  )
}

// ── ВКЛАДКА: Теги (курация) ───────────────────────────────────────────────────
function TagsTab() {
  const [films, setFilms]   = useState<AdminFilm[]>([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading]       = useState(false)

  const load = useCallback(async (p = 1, s = search, t = typeFilter) => {
    setLoading(true)
    try {
      const res = await api.admin.films({ page: p, search: s || undefined, type: t || undefined })
      setFilms(res.films as AdminFilm[]); setTotal(res.total); setPages(res.pages); setPage(p)
    } finally { setLoading(false) }
  }, [search, typeFilter])

  useEffect(() => { load() }, []) // eslint-disable-line

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Название..." />
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); load(1, search, e.target.value) }}
          style={{ padding: '7px 10px', border: `1px solid ${T.rule}`, background: T.paper, fontFamily: T.sans, fontSize: 12, borderRadius: 3 }}>
          <option value="">Все типы</option>
          <option value="movie">Фильмы</option>
          <option value="series">Сериалы</option>
          <option value="anime">Аниме</option>
          <option value="book">Книги</option>
        </select>
        <Btn label="Найти" onClick={() => load(1, search, typeFilter)} />
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute, marginLeft: 'auto' }}>{total} фильмов</span>
      </div>

      {/* Легенда */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 14, fontSize: 10, fontFamily: T.mono }}>
        <span style={{ color: T.orange }}>■ admin</span>
        <span style={{ color: T.green  }}>■ user</span>
        <span style={{ color: T.blue   }}>■ heuristic</span>
      </div>

      {loading ? <Loading /> : (
        <div>
          {films.map(film => (
            <FilmTagRow key={film.id} film={film} onUpdated={f => setFilms(prev => prev.map(x => x.id === f.id ? f : x))} />
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={p => load(p)} />
    </div>
  )
}

function FilmTagRow({ film, onUpdated }: { film: AdminFilm; onUpdated: (f: AdminFilm) => void }) {
  const [open, setOpen] = useState(false)

  const sourceColor = (src: string) =>
    src === 'admin' ? T.orange : src === 'user' ? T.green : T.blue

  return (
    <div style={{ borderBottom: `1px solid ${T.rule}`, padding: '12px 0' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
        {film.posterUrl && <img src={film.posterUrl} style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} alt="" />}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{film.title}</span>
            {film.year && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMute }}>{film.year}</span>}
            <span style={{ fontSize: 10, background: T.paperDeep, padding: '2px 5px', borderRadius: 2, color: T.inkMute }}>{TYPE_LABEL[film.type]}</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMute, marginLeft: 'auto' }}>{film._count.reviews} отзыв(ов)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6 }}>
            {film.emotionTags.length === 0
              ? <span style={{ fontSize: 11, color: T.red, fontFamily: T.mono }}>нет тегов</span>
              : film.emotionTags.map(t => (
                  <span key={t.id} style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 2,
                    border: `1px solid ${sourceColor(t.source)}`, color: sourceColor(t.source),
                  }}>{t.tag} {t.confidence < 1 ? `${Math.round(t.confidence * 100)}%` : ''}</span>
                ))}
          </div>
        </div>
        <span style={{ color: T.inkMute, fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <TagEditor film={film} onSaved={f => { onUpdated(f); setOpen(false) }} />}
    </div>
  )
}

function TagEditor({ film, onSaved }: { film: AdminFilm; onSaved: (f: AdminFilm) => void }) {
  const [mood,   setMood]   = useState(film.emotionTags.filter(t => t.category === 'moodBefore').map(t => t.tag))
  const [effect, setEffect] = useState(film.emotionTags.filter(t => t.category === 'effectAfter').map(t => t.tag))
  const [atmo,   setAtmo]   = useState(film.emotionTags.filter(t => t.category === 'atmosphere').map(t => t.tag))
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const toggle = (list: string[], setList: (v: string[]) => void, tag: string) => {
    setList(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag])
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.admin.updateFilmTags(film.id, { moodBefore: mood, effectAfter: effect, atmosphere: atmo })
      setSaved(true)
      const newTags = [
        ...mood.map(tag => ({ id: 0, filmId: film.id, category: 'moodBefore',  tag, confidence: 1, source: 'admin' })),
        ...effect.map(tag => ({ id: 0, filmId: film.id, category: 'effectAfter', tag, confidence: 1, source: 'admin' })),
        ...atmo.map(tag =>   ({ id: 0, filmId: film.id, category: 'atmosphere',  tag, confidence: 1, source: 'admin' })),
      ]
      onSaved({ ...film, emotionTags: newTags })
    } catch { alert('Ошибка сохранения') }
    setSaving(false)
  }

  const Chip = ({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{
      padding: '4px 9px', fontSize: 11, borderRadius: 3,
      border: `1px solid ${active ? T.ink : T.rule}`,
      background: active ? T.ink : 'transparent',
      color: active ? T.paper : T.inkSoft, cursor: 'pointer', fontFamily: T.sans,
    }}>{tag}</button>
  )

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.rule}` }}>
      {[
        { title: 'Настроение', tags: MOOD_BEFORE_TAGS, sel: mood, setFn: setMood },
        { title: 'Эффект',     tags: EFFECT_AFTER_TAGS, sel: effect, setFn: setEffect },
        { title: 'Атмосфера',  tags: ATMOSPHERE_TAGS,  sel: atmo,   setFn: setAtmo },
      ].map(({ title, tags, sel, setFn }) => (
        <div key={title} style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.inkMute, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 7 }}>{title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tags.map(tag => <Chip key={tag} tag={tag} active={sel.includes(tag)} onClick={() => toggle(sel, setFn, tag)} />)}
          </div>
        </div>
      ))}
      <button onClick={handleSave} disabled={saving} style={{
        padding: '7px 18px', background: T.ink, color: T.paper, border: 'none',
        cursor: 'pointer', fontFamily: T.sans, fontSize: 12, borderRadius: 3,
      }}>
        {saving ? 'Сохраняем...' : saved ? '✓ Сохранено' : 'Сохранить теги'}
      </button>
    </div>
  )
}

// ── Прочие утилиты ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMute, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function Tag({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 6px', borderRadius: 2,
      border: `1px solid ${color ?? T.rule}`, color: color ?? T.inkMute,
    }}>{label}</span>
  )
}

function Loading() {
  return <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>загружаем...</div>
}

function Error({ msg }: { msg: string }) {
  return <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: T.mono, fontSize: 11, color: T.red }}>{msg}</div>
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const token = localStorage.getItem('ff_token')

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.red, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>FeelFilm Admin</div>
          <p style={{ color: T.inkSoft, fontSize: 14 }}>Войдите в аккаунт и вернитесь на эту страницу</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: T.sans }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Хедер */}
        <div style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 20, marginBottom: 28 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 6 }}>
            FeelFilm · Admin Panel
          </div>
          <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            Панель управления
          </h1>
        </div>

        {/* Вкладки */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.rule}`, marginBottom: 28, gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 20px', border: 'none',
              borderBottom: t === tab ? `2px solid ${T.ink}` : '2px solid transparent',
              background: 'transparent',
              color: t === tab ? T.ink : T.inkMute,
              fontFamily: T.sans, fontSize: 13, fontWeight: t === tab ? 600 : 400,
              cursor: 'pointer', marginBottom: -1,
            }}>{TAB_LABELS[t]}</button>
          ))}
        </div>

        {/* Контент */}
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'reviews'   && <ReviewsTab />}
        {tab === 'users'     && <UsersTab />}
        {tab === 'tags'      && <TagsTab />}
      </div>
    </div>
  )
}
