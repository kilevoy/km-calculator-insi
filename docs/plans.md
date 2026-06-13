# План выпуска

## Завершено

- [x] Аудит Excel R2.0.1 и реестр полей.
- [x] Типизированная модель всех входов.
- [x] Расчёт стоимости, срока, массы и breakdown.
- [x] Независимый Excel oracle и 75 эталонных сценариев.
- [x] Полный адаптивный UI.
- [x] PDF, черновики и share URL.
- [x] Защищённый Google Drive proxy.
- [x] CI и production build.

## Перед корпоративным запуском

- [ ] Выдать Google Workspace credentials и folder ID.
- [ ] Задать production secrets и CORS origins.
- [ ] Развернуть frontend и proxy за HTTPS.
- [ ] Провести приёмку менеджерами на 10-20 реальных проектах.
- [ ] Добавить Git remote и опубликовать репозиторий.

Изменение исходной книги требует нового SHA-256, повторного `npm run audit:excel`, обновления эталонов через `npm run fixtures:excel` и полного `npm run quality`.
