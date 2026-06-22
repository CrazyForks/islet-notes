import type { CalendarDayRecord } from '@/core/state/calendar';
import { getDateFnsLocale } from '@/locales/common/locale';
import { styles } from '@/mobile/styles/ui';
import { Calendar } from '@/mobile/test.id';
import { localize } from '@/nls';
import { format } from 'date-fns';
import React from 'react';
import { DayRecordItem } from './DayRecordItem';

interface DayRecordsProps {
  date: Date;
  records: CalendarDayRecord[];
  onOpenRecord: (record: CalendarDayRecord) => void;
}

export function DayRecords({ date, records, onOpenRecord }: DayRecordsProps) {
  const locale = getDateFnsLocale();
  const imagePreviewAttachments = records
    .map((record) => record.image)
    .filter((attachment): attachment is NonNullable<CalendarDayRecord['image']> => !!attachment);

  return (
    <section className={styles.DayRecords.Root} data-test-id={Calendar.records}>
      <h2 className={styles.DayRecords.Title}>
        {format(date, localize('calendar.dayTitleDateFormat', 'MMM d, EEE'), {
          locale,
        })}
        {' · '}
        {localize('calendar.recordCount', '{0} entries', records.length)}
      </h2>
      {records.length === 0 ? (
        <div className={styles.DayRecords.Empty} data-test-id={Calendar.empty}>
          {localize('calendar.empty', 'No entries on this day')}
        </div>
      ) : (
        <div className={styles.DayRecords.Timeline}>
          {records.map((record) => (
            <DayRecordItem
              key={record.entry.id}
              record={record}
              imagePreviewAttachments={imagePreviewAttachments}
              onOpen={() => onOpenRecord(record)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
