# Калькулятор стоимости проектных работ КМ

Production-oriented SPA для менеджеров ИНСИ. Калькулятор переносит модель Excel R2.0.1 в типизированное клиентское приложение: шесть конструктивных систем, полный набор параметров объекта, мгновенный расчёт стоимости и срока, структура цены, PDF-КП, черновики, ссылки на расчёт и загрузка в Google Drive через защищённый прокси.

## Проверенный источник

- Книга: `source/KM_R2_0_1.xlsx`
- SHA-256: `fa7deef4f4efa825f10930cad915c4361ed3c066be6d61d7caaeb827f9d639b7`
- Аудит: 3 листа, 1146 формул и 154 элемента управления
- Машинный отчёт: `docs/excel-audit.json`
- Карта модели и полей: `docs/excel-model.md`

Расчёт проверяется не значениями, сгенерированными TypeScript-кодом, а результатами настоящего Excel через COM:

- 30 сценариев геометрии, систем и кровель;
- 45 изолированных сценариев дополнительных функций;
- эталонная конфигурация книги;
- допуск стоимости и срока: менее 3%;
- всего 118 автоматических тестов: 114 frontend/расчётных и 4 security-теста прокси.

## Возможности

- Все 6 систем: Спринт-М, Спринт-2М, Великан, Атлант, Атлант-М, Крон.
- До 5 пролётов и произвольный/одинаковый шаг рам.
- Перекрытия, 3 антресоли, опорные и подвесные краны.
- Все 8 вариантов лестниц из Excel.
- Кровля, ПВХ, снегозадержание, ограждение и водосток.
- Стены, толщина и ориентация, окна, ворота и двери.
- 3 перегородки, проёмы, парапеты и подстропильные фермы.
- СНиП/СП или Еврокод, сейсмика, огнестойкость, разделы КМ/АС.
- Адаптивный desktop/mobile интерфейс и live calculation.
- PDF-КП, versioned localStorage и versioned share URL.
- Настраиваемая базовая цена с сохранением в расчёте, ссылке и PDF.

## Быстрый запуск

Требования: Node.js 20+, npm и Python 3.11+.

```powershell
npm ci
python -m pip install -r requirements.txt
npm run quality
npm run dev
```

Приложение откроется на `http://localhost:5173`.

Production-сборка:

```powershell
npm run build
npm run preview
```

Vite использует относительный `base`, поэтому содержимое `dist/` подходит для GitHub Pages и статического VPS.

## Публикация на GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` автоматически собирает и публикует
SPA после push в ветку `main`.

1. Откройте `Settings → Pages` и выберите источник `GitHub Actions`.
2. Запустите workflow `Deploy GitHub Pages` вручную или выполните push в `main`.

GitHub Pages публикует только frontend. Загрузка в Google Drive требует отдельного
развёртывания `server.py` за HTTPS; статический Pages не может выполнять FastAPI.

## Контроль качества

```powershell
npm run lint
npm run typecheck
npm test
npm run test:server
npm run build
npm run quality
```

Эталоны Excel лежат в `tests/fixtures`. Для их повторной генерации нужен Windows с установленным Microsoft Excel:

```powershell
npm run audit:excel
npm run fixtures:excel
```

`fixtures:excel` запускает Excel через COM и обновляет результаты независимо от реализации калькулятора.

## Google Drive

Расчёт выполняется только в браузере. FastAPI используется исключительно как прокси загрузки PDF в корпоративный Drive.

```powershell
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python server.py
```

Обязательные production-параметры:

- `DRIVE_UPLOAD_TOKEN` — длинный случайный Bearer-токен;
- `ALLOWED_ORIGINS` — точные origin интерфейса;
- `GOOGLE_API_SCRIPT` — путь к авторизованному `google_api.py`;
- `DRIVE_ROOT_FOLDER_ID` — ID заранее созданной корпоративной папки; если не указан, прокси найдёт или создаст `КМ-Калькулятор`;
- `BUSINESS_TIMEZONE` — часовой пояс для подпапок `ГГГГ-ММ`;
- reverse proxy должен аутентифицировать пользователя и добавлять Bearer-токен при передаче `/api` в FastAPI;
- при локальной разработке Vite читает `DRIVE_UPLOAD_TOKEN` только в Node-конфигурации proxy и не включает его в browser bundle.

Endpoint принимает только PDF, ограничивает размер, очищает имя файла, проверяет folder ID, использует временный файл и таймаут. При отсутствии явного `folder_id` файл сохраняется в `КМ-Калькулятор/ГГГГ-ММ`. Публиковать прокси без HTTPS и внешнего reverse proxy нельзя.

## Архитектура

- `src/types/calculator.ts` — полный контракт входов и результата.
- `src/data/defaults.ts` — эталонное начальное состояние Excel.
- `src/logic/calculator.ts` — чистое расчётное ядро и диагностический trace.
- `src/logic/validation.ts` — ограничения и несовместимые комбинации.
- `src/components/CalculatorForm.tsx` — все расчётные пользовательские поля Excel.
- `src/components/ResultCard.tsx` — итог, breakdown и действия.
- `src/components/PDFReport.tsx` — печатный A4-шаблон.
- `src/hooks/useCalculator.ts` — расчёт и versioned URL.
- `server.py` — защищённый Drive upload proxy.

## Граница готовности

Калькулятор, PDF, черновики, URL, тесты, CI и статическая публикация готовы. Для полного ввода в корпоративную эксплуатацию остаются внешние операции: выдать OAuth/service credentials Google Workspace, назначить целевую папку, развернуть прокси за HTTPS и выполнить приёмочный тест загрузки в реальный Drive.
