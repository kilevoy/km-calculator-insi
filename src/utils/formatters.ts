/**
 * Formats a number as a currency string in Russian style (thousands separated by spaces)
 * @param value value in thousands of rubles (тыс. руб.)
 */
export function formatCurrency(value: number): string {
  // Multiply by 1000 if we want full rubles, or show as thousands
  // The spreadsheet shows cost as тыс. руб., so let's format it in thousands but with nice spacing
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' тыс. руб.';
}

/**
 * Formats a number as ruble value (full rubles)
 * @param value value in rubles
 */
export function formatRubles(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats building area in square meters
 */
export function formatArea(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value) + ' м²';
}

/**
 * Formats weight in tons
 */
export function formatWeight(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' т';
}

/**
 * Formats timeline days
 */
export function formatDays(value: number): string {
  const rounded = Math.ceil(value);
  let suffix = 'рабочих дней';
  const lastDigit = rounded % 10;
  const lastTwoDigits = rounded % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    suffix = 'рабочих дней';
  } else if (lastDigit === 1) {
    suffix = 'рабочий день';
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    suffix = 'рабочих дня';
  }
  
  return `${rounded} ${suffix}`;
}

/**
 * Formats dates into DD.MM.YYYY
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU').format(date);
}
