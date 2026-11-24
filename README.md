# Mini CRM Funnel

MVP: **воронка лидов + роли + AI-подсказка следующего шага**.

Не «чат ради чата», а простой бизнес-процесс: менеджер ведёт лиды по статусам, нейросеть предлагает **что сделать дальше** и черновик сообщения.

**Демо:** https://mini-crm-funnel-mocha.vercel.app  
**Код:** https://github.com/VyrvikhvistYana/mini-crm-funnel

## Проблема

Менеджеры теряют лиды: забывают follow-up, прыгают по статусам без правил, тратят время на текст касания с нуля.

## Что умеет демо

- Роли: **admin** видит и редактирует всех, **manager** — только своих
- Воронка со **строгими переходами**: `new → contacted → qualified → proposal → won/lost` (нельзя `new → won`)
- Канбан с **drag-and-drop** (запрещённый переход не применится)
- Создание / удаление лида, заметки, «дней без касания»
- Подтверждение сохранения (зелёная галочка) для статуса и заметок
- Подсветка карточки при создании и при возврате на доску
- Кнопка **«Что делать дальше?»**:
  - есть `GEMINI_API_KEY` → ответ Gemini
  - нет ключа / API недоступен → запасная эвристика
- Offline-проверка эвристики: `npm run eval` (10 эталонных кейсов)
- E2E на Playwright: `npm test`

## Быстрый старт

```bash
git clone https://github.com/VyrvikhvistYana/mini-crm-funnel.git
cd mini-crm-funnel
npm install
cp .env.example .env
npm run dev
```

Открой http://localhost:3000

### Демо-пользователи

| Роль | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.local` | `admin` |
| Manager | `manager@demo.local` | `manager` |
| Manager 2 | `manager2@demo.local` | `manager` |

### Ключ Gemini (опционально)

1. Создай ключ: https://aistudio.google.com/apikey  
2. В `.env`:

```env
GEMINI_API_KEY=ваш_ключ
GEMINI_MODEL=gemini-3.6-flash
```

Без ключа демо всё равно работает (эвристика). **Не коммитьте `.env`.**

На Vercel те же переменные: Project → Settings → Environment Variables.

## E2E (Playwright)

```bash
npm install
npx playwright install chromium   # на CI / Linux
npm test
```

На macOS 13 Arm, если bundled Chromium не ставится, конфиг использует системный Google Chrome (`channel: "chrome"`).

Покрыто: логин, создание/удаление лида, заметка + toast, смена статуса + подсветка, права manager/admin, AI suggest (мок API).

Workflow `.github/workflows/e2e.yml` лежит локально; на GitHub Actions попадёт после пуша с правом `workflow`.

## Как устроено

```
src/app/          страницы и API
src/components/   доска, формы, AI-панель
src/data/         seed (15 лидов)
src/lib/          типы, права, переходы статусов, AI, localStorage
e2e/              Playwright-тесты
eval/             эталоны для проверки эвристики
```

Стек: Next.js (App Router) + TypeScript + Tailwind. Лиды — в **localStorage браузера** (стабильно на Vercel без общей серверной памяти). Логин — cookie-сессия.

## Ограничения MVP

- Нет настоящей БД и регистрации «как в проде»
- Нет отправки писем из продукта
- Нет мультитенантности и интеграций с Bitrix/amocrm
- Нет экрана управления пользователями у admin

## Дальше (идеи)

- Postgres вместо localStorage
- Нормальный auth (Clerk / NextAuth)
- Tool calling у агента
- Короткий скринкаст демо

## Лицензия

Учебный / портфолио-проект.
