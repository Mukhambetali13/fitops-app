# FitOps

Личное приложение для тренировок под сменный график (2 дневные / 2 ночные / 4 выходных), техник упражнений, чек-листа дня и трекера отказа от курения.

Стек: Go (бэкенд + отдаёт собранный фронтенд) · React + Vite + Tailwind (фронтенд) · Postgres (данные).

## Структура проекта

```
fitops-app/
  backend/        Go-сервер: API + встроенный (embed) фронтенд
  frontend/       React-приложение (Vite)
  Dockerfile      Сборка фронтенда + бэкенда в один образ
  docker-compose.yml   Локальный запуск с Postgres в Docker
  render.yaml     Блюпринт для деплоя на Render.com
```

## 1. Локальный запуск (для разработки)

Нужны: Go 1.22+, Node.js 20+, Docker (для локальной Postgres — необязательно, можно поставить Postgres руками).

### Вариант А — всё через Docker Compose (проще всего)

```bash
docker compose up --build
```

Поднимет Postgres + соберёт и запустит бэкенд с уже встроенным фронтендом на `http://localhost:8080`.
Пароль по умолчанию для входа: `changeme` (задан в `docker-compose.yml`, поменяй на свой).

### Вариант Б — раздельная разработка (с горячей перезагрузкой фронтенда)

Терминал 1 — Postgres (например через Docker):
```bash
docker run -d --name fitops-db -e POSTGRES_USER=fitops -e POSTGRES_PASSWORD=fitops -e POSTGRES_DB=fitops -p 5432:5432 postgres:16-alpine
```

Терминал 2 — бэкенд:
```bash
cd backend
export DATABASE_URL="postgres://fitops:fitops@localhost:5432/fitops?sslmode=disable"
export APP_PASSWORD="changeme"
export AUTH_SECRET="любая-случайная-строка"
go mod tidy
go run .
```

Терминал 3 — фронтенд (с прокси на localhost:8080, см. `vite.config.js`):
```bash
cd frontend
npm install
npm run dev
```
Открой `http://localhost:5173` в браузере.

## 2. Бесплатный деплой в интернет (доступ с телефона отовсюду)

Схема: **база данных на Neon** (бесплатный постоянный Postgres) + **сервер на Render** (бесплатный веб-сервис, собирает и раздаёт всё из одного Docker-образа — фронтенд и бэкенд вместе, поэтому не нужен отдельный хостинг под React).

### Шаг 1 — база данных (Neon)

1. Зайди на [neon.tech](https://neon.tech), зарегистрируйся (без карты).
2. Создай новый проект (Create project).
3. В разделе Connection Details скопируй **Connection string** — она выглядит так:
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require`
4. Сохрани эту строку — она понадобится как `DATABASE_URL`.

### Шаг 2 — код на GitHub

1. Создай пустой репозиторий на GitHub.
2. Из папки `fitops-app` выполни:
   ```bash
   git init
   git add .
   git commit -m "FitOps initial version"
   git branch -M main
   git remote add origin https://github.com/ТВОЙ_АККАУНТ/fitops.git
   git push -u origin main
   ```

### Шаг 3 — деплой на Render

1. Зайди на [render.com](https://render.com), зарегистрируйся (без карты).
2. New → Web Service → подключи свой GitHub-репозиторий с этим проектом.
3. Render автоматически обнаружит `Dockerfile` в корне — оставь Runtime = Docker.
4. Выбери план **Free**.
5. В разделе Environment добавь переменные:
   - `DATABASE_URL` — строка подключения из Neon (шаг 1)
   - `APP_PASSWORD` — придумай пароль, которым будешь заходить в приложение с телефона
   - `AUTH_SECRET` — любая случайная длинная строка (например сгенерируй командой `openssl rand -hex 32`)
6. Нажми Create Web Service. Первая сборка занимает пару минут.
7. Когда сборка завершится, Render даст ссылку вида `https://fitops-xxxx.onrender.com` — открой её с телефона и добавь на домашний экран (Safari → «Поделиться» → «На экран «Домой»»), будет работать как отдельное приложение.

**Важно про бесплатный тариф Render:** сервис «засыпает» после ~15 минут без запросов и первый запрос после этого грузится 30–60 секунд — для личного использования это не критично, просто первое открытие за день будет чуть дольше.

### Обновление после изменений в коде

```bash
git add .
git commit -m "изменения"
git push
```
Render сам пересоберёт и передеплоит сервис при каждом пуше в `main` (Auto-Deploy включён по умолчанию).

## 3. Настройка под себя

На вкладке **Прогресс** — впиши текущий вес и цель.
На вкладке **Расписание** — укажи дату, с которой начинается день 1 твоего цикла (дневная смена), дальше всё расписание на 8 дней вперёд считается автоматически и подстраивается под смены.
На вкладке **Курение** — впиши количество сигарет в день и цену пачки, чтобы видеть сэкономленные деньги, и нажми «Начать отсчёт».

Логику ротации смен и упражнения по дням можно менять в:
- `backend/cycle.go` (что показывается как тренировка дня для каждого из 8 дней цикла)
- `frontend/src/workoutsData.js` (сама техника выполнения упражнений)
