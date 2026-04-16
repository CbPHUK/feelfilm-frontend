import { useNavigate } from 'react-router-dom'

export function PrivacyPage() {
  const navigate = useNavigate()
  const updated = '16 апреля 2026 г.'

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 80px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--coral)', fontSize: 13, fontWeight: 600,
          padding: '0 0 24px', letterSpacing: '0.04em',
        }}
      >
        ← Назад
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.3px' }}>
        Политика конфиденциальности
      </h1>
      <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 32 }}>
        Последнее обновление: {updated}
      </p>

      <Section title="1. Кто мы">
        <p>
          FeelFilm — сервис для поиска фильмов, сериалов и книг по эмоциям. Сервис работает
          в формате Telegram Mini App и веб-приложения. Оператор персональных данных —
          физическое лицо, контакт: <a href="mailto:feelfilm.app@gmail.com" style={{ color: 'var(--coral)' }}>feelfilm.app@gmail.com</a>.
        </p>
      </Section>

      <Section title="2. Какие данные мы собираем">
        <p>При использовании сервиса мы можем обрабатывать следующие данные:</p>
        <ul>
          <li><b>Данные из Telegram:</b> имя пользователя, никнейм (@username), Telegram ID — передаются автоматически при входе через Telegram Mini App.</li>
          <li><b>Имя (псевдоним):</b> которое вы указываете при первом входе.</li>
          <li><b>Отзывы и теги эмоций:</b> информация о том, что вы смотрели и что почувствовали — хранится и отображается другим пользователям.</li>
          <li><b>Технические данные:</b> данные о запросах к серверу (логи), необходимые для работы и безопасности сервиса.</li>
        </ul>
        <p>Мы <b>не собираем</b> платёжные данные, геолокацию, список контактов и иные чувствительные категории данных.</p>
      </Section>

      <Section title="3. Зачем мы это используем">
        <ul>
          <li>Отображение вашего имени рядом с отзывами</li>
          <li>Поиск фильмов по совпадению эмоций с другими пользователями</li>
          <li>Формирование общей эмоциональной картины по каждому фильму</li>
          <li>Улучшение работы сервиса</li>
        </ul>
        <p>
          Правовое основание обработки — <b>согласие субъекта персональных данных</b> (ст. 6 ч. 1 п. 1 Федерального закона № 152-ФЗ
          «О персональных данных»), которое вы даёте при первом входе.
        </p>
      </Section>

      <Section title="4. Кому мы передаём данные">
        <p>
          Ваше имя и отзывы видны всем пользователям сервиса — это основная функция платформы.
          Мы не продаём и не передаём данные третьим лицам в рекламных целях.
        </p>
        <p>
          Для хранения данных используется сервер, арендованный у хостинг-провайдера.
          Провайдер имеет доступ к инфраструктуре, но не обрабатывает ваши данные самостоятельно.
        </p>
      </Section>

      <Section title="5. Как долго хранятся данные">
        <p>
          Данные хранятся до тех пор, пока вы пользуетесь сервисом. При удалении аккаунта
          (по запросу на почту) все ваши данные удаляются в течение 30 дней.
        </p>
      </Section>

      <Section title="6. Ваши права">
        <p>В соответствии с 152-ФЗ вы вправе:</p>
        <ul>
          <li>Получить информацию о том, какие данные о вас хранятся</li>
          <li>Потребовать исправления неверных данных</li>
          <li>Потребовать удаления своих данных</li>
          <li>Отозвать согласие на обработку персональных данных</li>
        </ul>
        <p>
          Для реализации прав обратитесь по адресу:{' '}
          <a href="mailto:feelfilm.app@gmail.com" style={{ color: 'var(--coral)' }}>feelfilm.app@gmail.com</a>.
          Мы ответим в течение 10 рабочих дней.
        </p>
      </Section>

      <Section title="7. Безопасность">
        <p>
          Мы используем HTTPS-шифрование при передаче данных. Доступ к базе данных
          ограничен и защищён. Тем не менее ни один сервис не может гарантировать
          абсолютную защиту — пожалуйста, не указывайте в отзывах личную информацию,
          которую не хотите показывать публично.
        </p>
      </Section>

      <Section title="8. Изменения политики">
        <p>
          Мы можем обновлять эту политику. При существенных изменениях уведомим вас
          через интерфейс сервиса. Продолжение использования сервиса после публикации
          изменений означает согласие с новой редакцией.
        </p>
      </Section>

      <div style={{
        marginTop: 40, padding: '16px 20px',
        borderRadius: 'var(--r-lg)',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.6,
      }}>
        Если у вас есть вопросы по обработке данных — пишите на{' '}
        <a href="mailto:feelfilm.app@gmail.com" style={{ color: 'var(--coral)' }}>feelfilm.app@gmail.com</a>.
        Федеральный закон «О персональных данных» от 27.07.2006 № 152-ФЗ.
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        fontSize: 15, fontWeight: 700, color: 'var(--text)',
        marginBottom: 10, letterSpacing: '-0.1px',
      }}>
        {title}
      </h2>
      <div style={{
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {children}
      </div>
    </div>
  )
}
