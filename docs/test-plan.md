# Тест-план production-калькулятора КМ

## Источник
- Задача: полный точный производственный калькулятор на базе Excel R2.0.1.
- План: `docs/plans.md`.
- Статус: `docs/status.md`.
- Последнее обновление: 2026-06-14.

## Область
- Включено: извлечение Excel-модели, расчёт, валидация, UI, PDF, URL, localStorage, Drive API.
- Не включено до получения инфраструктуры: реальная запись в корпоративный Google Drive production.

## Фикстуры
- Канонический Excel: `C:\Users\Deako\Downloads\Telegram Desktop\Калькулятор_стоимости_проектных_работ_КМ_R2_0_1.xlsx`.
- Независимые fixtures должны хранить Excel inputs/outputs и provenance лист/ячейка.
- Generated expected запрещено получать вызовом TypeScript `calculate`.

## Уровни

### Unit
- Границы диапазонов пролёта, высоты, длины и сейсмики.
- Все системы и кровли.
- Краны, перекрытия, антресоли, фермы, лестницы.
- Кровля, стены, проёмы, перегородки и парапеты.
- Нормализация URL/localStorage.
- Невалидные и неполные параметры.

### Integration
- Полный расчёт из формы до breakdown.
- PDF DOM -> Blob с ненулевым размером.
- Drive client -> API contract.
- API upload: auth, MIME, size, filename, cleanup, timeout.

### E2E / Smoke
- Создать расчёт для каждой из 6 систем.
- Проверить условные поля и запрещённые комбинации.
- Сохранить/загрузить/удалить черновик.
- Открыть share URL и получить эквивалентную конфигурацию.
- Скачать PDF и проверить ключевые строки.
- Проверить mobile tabs и desktop sticky result.

## Негативные сценарии
- URL с неизвестными enum и числовыми значениями вне диапазона.
- Нулевые, отрицательные, NaN и бесконечные значения.
- Пролёт вне допустимого диапазона.
- Несовместимая система/кровля/кран/ферма.
- Повреждённый localStorage.
- Clipboard/PDF/Drive недоступны.
- Drive: path traversal, oversized file, неверный MIME, отсутствующая auth.

## Acceptance Gates
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run test:server`
- [x] `npm run build`
- [ ] Browser E2E в CI
- [x] Excel fixtures проверяются unit/integration-тестами
- [ ] initial JS gzip менее 250 KB либо документированное исключение.
- [ ] WCAG AA для основных форм и действий.
- [ ] 0 blocker/critical дефектов.

## Команды
```powershell
npm run audit:excel
npm run lint
npm run typecheck
npm test
npm run build
npm run test:server
npm run quality
```

## Риски
- Excel может зависеть от кэша вычисленных значений и скрытых служебных ячеек.
- Часть формул может отражать исторические дефекты книги; такие случаи должны быть решены явно, а не подогнаны тестами.
- Google Drive нельзя считать проверенным без целевого аккаунта и папки.
