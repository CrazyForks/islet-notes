import { dateKey, groupEntriesByDate } from '@/core/state/calendar';
import { BottomTabBar } from '@/mobile/components/BottomTabBar';
import { CalendarCard } from '@/mobile/components/pages/calendar/CalendarCard.view';
import { DayRecords } from '@/mobile/components/pages/calendar/DayRecords';
import { PageHeader } from '@/mobile/components/PageHeader';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { Calendar } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { startOfDay, startOfMonth } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';

const CALENDAR_SESSION_STATE_KEY = 'islet.calendar.state';

export function CalendarPage() {
  const model = useDiaryModel();
  const navigationService = useService(INavigationService);
  const today = startOfDay(new Date());
  const sessionState = getCalendarSessionState();
  const [selectedDate, setSelectedDateState] = useState(() =>
    sessionState?.selectedDateKey ? new Date(`${sessionState.selectedDateKey}T00:00:00`) : today,
  );
  const [visibleMonth, setVisibleMonthState] = useState(() =>
    sessionState?.visibleMonthKey
      ? new Date(`${sessionState.visibleMonthKey}-01T00:00:00`)
      : startOfMonth(selectedDate),
  );

  const recordsByDate = useMemo(() => groupEntriesByDate(model), [model]);
  const selectedRecords = recordsByDate.get(dateKey(selectedDate)) ?? [];
  const selectedDateKey = dateKey(selectedDate);
  const visibleMonthKey = getMonthKey(visibleMonth);

  useEffect(() => {
    sessionStorage.setItem(
      CALENDAR_SESSION_STATE_KEY,
      JSON.stringify({ selectedDateKey, visibleMonthKey }),
    );
  }, [selectedDateKey, visibleMonthKey]);

  return (
    <div className={styles.CalendarPage.Root} data-test-id={Calendar.page}>
      <PageHeader title={localize('calendar.title', 'Calendar')} />
      <main className={styles.CalendarPage.Content} data-test-id={Calendar.content}>
        <CalendarCard
          today={today}
          selectedDate={selectedDate}
          visibleMonth={visibleMonth}
          recordsByDate={recordsByDate}
          onSelectDate={setSelectedDateState}
          onChangeVisibleMonth={setVisibleMonthState}
        />
        <DayRecords
          date={selectedDate}
          records={selectedRecords}
          onOpenRecord={(record) =>
            navigationService.navigate({
              path: `/diary/${record.entry.notebookId}?targetEntryId=${encodeURIComponent(record.entry.id)}`,
            })
          }
        />
      </main>
      <BottomTabBar active='calendar' />
    </div>
  );
}

interface CalendarSessionState {
  selectedDateKey?: string;
  visibleMonthKey?: string;
}

function getCalendarSessionState(): CalendarSessionState | undefined {
  const raw = sessionStorage.getItem(CALENDAR_SESSION_STATE_KEY);
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  const value = parsed as { selectedDateKey?: unknown; visibleMonthKey?: unknown };
  return {
    selectedDateKey: typeof value.selectedDateKey === 'string' ? value.selectedDateKey : undefined,
    visibleMonthKey: typeof value.visibleMonthKey === 'string' ? value.visibleMonthKey : undefined,
  };
}

function getMonthKey(date: Date): string {
  return dateKey(startOfMonth(date)).slice(0, 7);
}
