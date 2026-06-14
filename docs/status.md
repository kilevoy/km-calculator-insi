# Статус проекта на 2026-06-14

## Готово

- Полная инвентаризация Excel R2.0.1 и фиксация SHA-256.
- Все пользовательские поля книги представлены в типизированной модели и UI.
- Чистое расчётное ядро с разбивкой и диагностическим trace.
- 30 геометрических и 45 функциональных эталонов получены реальным Excel COM.
- 117 тестов проверяют расчёты, внешние данные, границы, начальное состояние и security-контракт прокси.
- Desktop/mobile UI, sticky result, мобильные вкладки и live calculation.
- Рабочий A4 PDF-КП проверен скачиванием в браузере.
- Versioned URL и localStorage с безопасным восстановлением.
- Drive proxy с Bearer auth, CORS allowlist, PDF/size/path validation и timeout.
- CI для lint, typecheck, tests и production build.

## Проверка

`npm run quality` должен проходить перед каждым выпуском. Эталоны Excel можно воспроизвести командой `npm run fixtures:excel` на Windows с установленным Microsoft Excel.

## Остаточные внешние работы

- Подключить корпоративные Google Workspace credentials.
- Назначить production folder ID и проверить реальную загрузку.
- Развернуть frontend и FastAPI proxy за HTTPS.
- Настроить GitHub Pages в `Settings → Pages` после первого push.

Это не дефекты расчётного приложения, а требования конкретного production-окружения.

Проверка 2026-06-14: Google Workspace CLI вернул `NOT_AUTHENTICATED`; сетевые изменения в Drive не выполнялись.

## Профессиональная оценка

| Область | Оценка | Основание |
| --- | ---: | --- |
| UI/UX | 9/10 | Полный адаптивный интерфейс; требуется только приёмка реальными менеджерами |
| Frontend-архитектура | 9/10 | Строгие типы, чистое ядро, versioned persistence, lazy heavy modules |
| Надёжность расчётов | 9/10 | 75 независимых Excel-сценариев и 117 тестов; нет полного комбинаторного перебора |
| Безопасность и эксплуатация | 8/10 | Прокси усилен; production HTTPS, secrets и Drive credentials внешние |
| Внутренняя демонстрация | 10/10 | UI, расчёт, breakdown, PDF, URL и черновики готовы |
| Production readiness | 8/10 | Код готов; реальная Drive-инфраструктура и deployment ещё не предоставлены |
