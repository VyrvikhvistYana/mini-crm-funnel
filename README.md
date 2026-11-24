# Mini CRM Funnel

Портфолио-MVP: **воронка лидов + роли + AI-подсказка следующего шага**.

Не «чат ради чата», а простой бизнес-процесс: менеджер ведёт лиды по статусам, нейросеть предлагает **что сделать дальше** и черновик сообщения.

## Проблема

Менеджеры теряют лиды: забывают follow-up, прыгают по статусам без правил, тратят время на текст касания с нуля.

## Что умеет демо

- Роли: **admin** видит всех, **manager** — только своих
- Воронка со **строгими переходами**: `new → contacted → qualified → proposal → won/lost` (нельзя `new → won`)
- Канбан с **drag-and-drop** (запрещённый переход не применится)
- Создание лида, заметки, «дней без касания»
- Кнопка **«Что делать дальше?»**:
  - есть `GEMINI_API_KEY` → ответ Gemini
  - нет ключа / API недоступен → запасная эвристика
- Offline-проверка эвристики: `npm run eval` (10 эталонных кейсов)

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

На Vercel добавьте те же переменные в Project → Settings → Environment Variables.

## Как устроено

```
src/app/          страницы и API
src/components/   доска, формы, AI-панель
src/data/         seed (15 лидов) + хранилище в памяти
src/lib/          типы, права, переходы статусов, AI
eval/             эталоны для проверки эвристики
```

Стек: Next.js (App Router) + TypeScript + Tailwind. Лиды хранятся в **localStorage браузера** (чтобы демо стабильно работало на Vercel без общей серверной памяти). Логин — cookie-сессия.

## Ограничения MVP

- Нет настоящей БД и регистрации «как в проде»
- Нет отправки писем из продукта
- Нет мультитенантности и интеграций с Bitrix/amocrm

## Дальше (идеи)

- Postgres вместо памяти
- Нормальный auth (Clerk / NextAuth)
- Tool calling у агента
- Деплой + короткий скринкаст

## Лицензия

Учебный / портфолио-проект.
