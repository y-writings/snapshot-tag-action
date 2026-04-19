const SNAPSHOT_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;

function parseSnapshotDateParts(snapshotDate: string): { year: number; month: number; day: number } {
  const [yearText, monthText, dayText] = snapshotDate.split('.');

  return {
    year: Number.parseInt(yearText, 10),
    month: Number.parseInt(monthText, 10),
    day: Number.parseInt(dayText, 10),
  };
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));

  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;
}

export function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');

  return `${year}.${month}.${day}`;
}

export function resolveSnapshotDate(snapshotDate: string | undefined, now: Date = new Date()): string {
  if (snapshotDate !== undefined && snapshotDate !== '') {
    return snapshotDate;
  }

  return formatUtcDate(now);
}

export function validateSnapshotDate(snapshotDate: string): void {
  if (!SNAPSHOT_DATE_PATTERN.test(snapshotDate)) {
    throw new Error('snapshot date must use YYYY.MM.DD format');
  }

  const { year, month, day } = parseSnapshotDateParts(snapshotDate);

  if (!isValidCalendarDate(year, month, day)) {
    throw new Error('snapshot date must be a real calendar date in YYYY.MM.DD format');
  }
}

export function buildSnapshotTag(snapshotDate: string): string {
  validateSnapshotDate(snapshotDate);
  return `v${snapshotDate}`;
}
