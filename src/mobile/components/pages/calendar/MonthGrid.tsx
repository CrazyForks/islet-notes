import { dateKey, type CalendarDayRecord } from '@/core/state/calendar';
import { cx, styles } from '@/mobile/styles/ui';
import { Calendar } from '@/mobile/test.id';
import { format, isAfter, isSameDay } from 'date-fns';
import React, { useMemo } from 'react';
import { buildCalendarCells } from './calendarGrid';

export function MonthGrid({
  month,
  today,
  selectedDate,
  recordsByDate,
  onSelect,
  activePanel,
}: {
  month: Date;
  today: Date;
  selectedDate: Date;
  recordsByDate: Map<string, CalendarDayRecord[]>;
  onSelect: (date: Date) => void;
  activePanel: boolean;
}) {
  const cells = useMemo(() => buildCalendarCells(month, today), [month, today]);
  return (
    <div className={styles.MonthGrid.DayGrid}>
      {cells.map((cell) => {
        if (!cell.date) return <span key={cell.key} className={styles.MonthGrid.DayButton} />;
        const todayCell = isSameDay(cell.date, today);
        const future = isAfter(cell.date, today);
        if (future) return <span key={cell.key} className={styles.MonthGrid.DayButton} />;
        const hasRecord = (recordsByDate.get(dateKey(cell.date))?.length ?? 0) > 0;
        const disabled = !todayCell && !hasRecord;
        const selected = !disabled && isSameDay(cell.date, selectedDate);
        return (
          <button
            key={cell.key}
            className={styles.MonthGrid.DayButton}
            type='button'
            data-test-id={Calendar.day}
            aria-pressed={selected}
            disabled={disabled}
            tabIndex={activePanel && !disabled ? undefined : -1}
            onClick={() => onSelect(cell.date!)}
          >
            <span
              className={cx(
                styles.MonthGrid.DayInner,
                selected
                  ? styles.MonthGrid.DaySelected
                  : disabled
                    ? styles.MonthGrid.DayPastEmpty
                    : styles.MonthGrid.DayNormal,
              )}
            >
              {format(cell.date, 'd')}
            </span>
            <span className={styles.MonthGrid.DayDotRow} />
          </button>
        );
      })}
    </div>
  );
}
