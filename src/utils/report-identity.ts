const pad = (value: number) => String(value).padStart(2, '0');

export function createCalculationNumber(
  date = new Date(),
  randomValue = Math.random(),
): string {
  const datePart = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('');
  const timePart = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
  const suffix = Math.floor(randomValue * 36 ** 4)
    .toString(36)
    .padStart(4, '0')
    .slice(-4)
    .toUpperCase();

  return `KM-${datePart}-${timePart}-${suffix}`;
}

const sanitizeFilenamePart = (value: string): string =>
  Array.from(value)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('')
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);

export function createReportFilename({
  calculationNumber,
  projectName,
  system,
  areaM2,
}: {
  calculationNumber: string;
  projectName?: string;
  system: string;
  areaM2: number;
}): string {
  const projectPart = sanitizeFilenamePart(projectName ?? '');
  const systemPart = sanitizeFilenamePart(system);
  const areaPart = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
    useGrouping: false,
  }).format(areaM2);
  const parts = ['КМ', projectPart, systemPart, `${areaPart}м2`, calculationNumber]
    .filter(Boolean);

  return `${parts.join('_')}.pdf`;
}
