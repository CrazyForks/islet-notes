import { format, isSameDay, isSameYear } from 'date-fns';
import { getCurrentLocale, getDateFnsLocale } from '@/locales/common/locale';

export interface FormatNotebookListTimeOptions {
  timestamp: number | Date;
  currenttime: number | Date;
  timezone: string;
  locale?: string;
}

export function formatNotebookListTime(options: FormatNotebookListTimeOptions): string {
  const localeKey = options.locale ?? getCurrentLocale();
  const date = toZonedLocalDate(options.timestamp, options.timezone);
  const current = toZonedLocalDate(options.currenttime, options.timezone);
  const locale = getDateFnsLocale(localeKey);

  if (isSameDay(date, current)) {
    return format(date, 'HH:mm', { locale });
  }

  if (isSameYear(date, current)) {
    return format(date, getLocalizedDatePattern(localeKey, false), { locale });
  }

  return format(date, getLocalizedDatePattern(localeKey, true), { locale });
}

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function toZonedLocalDate(value: number | Date, timezone: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const partMap = new Map(parts.map((part) => [part.type, part.value]));

  return new Date(
    Number(partMap.get('year')),
    Number(partMap.get('month')) - 1,
    Number(partMap.get('day')),
    Number(partMap.get('hour')),
    Number(partMap.get('minute')),
    Number(partMap.get('second')),
  );
}

function getLocalizedDatePattern(locale: string, includeYear: boolean): string {
  const order = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date(Date.UTC(2026, 10, 22)))
    .map((part) => part.type)
    .filter(
      (type): type is 'year' | 'month' | 'day' =>
        type === 'year' || type === 'month' || type === 'day',
    );
  const tokenMap = {
    year: 'yyyy',
    month: 'MM',
    day: 'dd',
  };

  const separator = locale === 'en-US' ? '/' : '-';

  return order
    .filter((type) => includeYear || type !== 'year')
    .map((type) => tokenMap[type])
    .join(separator);
}
