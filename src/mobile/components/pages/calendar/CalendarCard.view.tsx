import { Calendar } from '@/mobile/test.id';
import { dateKey, type CalendarDayRecord } from '@/core/state/calendar';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { getDateFnsLocale } from '@/locales/common/locale';
import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MonthGrid } from './MonthGrid';
import { PANEL_STEP, panelHeight, SLIDE_DURATION, WEEKDAY_DATES } from './calendarGrid';

interface CalendarCardProps {
  today: Date;
  selectedDate: Date;
  visibleMonth: Date;
  recordsByDate: Map<string, CalendarDayRecord[]>;
  onSelectDate: (date: Date) => void;
  onChangeVisibleMonth: (month: Date) => void;
}

export function CalendarCard({
  today,
  selectedDate,
  visibleMonth,
  recordsByDate,
  onSelectDate,
  onChangeVisibleMonth,
}: CalendarCardProps) {
  const locale = getDateFnsLocale();
  // 轮播轨道:始终渲染 [上个月, 当前月, 下个月] 三块面板,默认居中显示中间那块。
  const months = useMemo(
    () => [addMonths(visibleMonth, -1), visibleMonth, addMonths(visibleMonth, 1)],
    [visibleMonth],
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  // step: 0=滑向上个月, 1=居中, 2=滑向下个月; dragX: 跟手拖动的像素偏移。
  const [step, setStep] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);
  // 手势在原生监听器闭包中读取,用 ref 保存实时值,避免闭包过期。
  const animatingRef = useRef(false);
  const dragXRef = useRef(0);
  // 视口宽度:拖动时按 dragX/width 的比例向目标月份高度插值。
  const widthRef = useRef(0);
  // 当月即上界,不能再翻到未来月;原生监听器闭包用 ref 读取实时值。
  const canNextRef = useRef(true);

  const setAnim = useCallback((value: boolean) => {
    animatingRef.current = value;
    setAnimating(value);
  }, []);

  const setDrag = useCallback((value: number) => {
    dragXRef.current = value;
    setDragX(value);
  }, []);

  // 启动一次滑向相邻月份的动画;真正切换数据放到动画结束后(handleTransitionEnd)。
  const slideTo = useCallback(
    (target: 0 | 2) => {
      if (animatingRef.current) return;
      setAnim(true);
      setDrag(0);
      setStep(target);
    },
    [setAnim, setDrag],
  );

  const settleBack = useCallback(() => {
    setAnim(true);
    setDrag(0);
    setStep(1);
  }, [setAnim, setDrag]);

  const commitMonth = (offset: number) => {
    const next = addMonths(visibleMonth, offset);
    onChangeVisibleMonth(next);
  };

  // 动画结束:把中心月切到刚滑到的那一块,并把轨道无动画地复位到居中,实现无缝衔接。
  const handleTransitionEnd = (event: React.TransitionEvent) => {
    if (event.propertyName !== 'transform' || !animatingRef.current) return;
    if (step === 2) commitMonth(1);
    else if (step === 0) commitMonth(-1);
    setAnim(false);
    setStep(1);
    setDrag(0);
  };

  const selectToday = () => {
    if (animatingRef.current) return;
    onChangeVisibleMonth(startOfMonth(today));
    onSelectDate(today);
  };

  // 跟手拖动通过原生非 passive 监听器实现,以便横向滑动时阻止页面纵向滚动。
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let width = 0;
    let tracking = false;
    let axis: 'h' | 'v' | null = null;

    const onStart = (event: TouchEvent) => {
      if (animatingRef.current || event.touches.length !== 1) return;
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      width = el.offsetWidth || 1;
      widthRef.current = width;
      tracking = true;
      axis = null;
    };

    const onMove = (event: TouchEvent) => {
      if (!tracking) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (axis === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
      if (axis === 'v') return; // 纵向手势交给页面滚动
      event.preventDefault();
      setDrag(Math.max(-width, Math.min(width, dx)));
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (axis !== 'h') {
        setDrag(0);
        return;
      }
      const dx = dragXRef.current;
      const threshold = Math.max(48, width * 0.18);
      if (dx <= -threshold && canNextRef.current) slideTo(2);
      else if (dx >= threshold) slideTo(0);
      else if (dx !== 0) settleBack();
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [setDrag, slideTo, settleBack]);

  // 当月即上界:不能翻到未来月(右箭头禁用、向后滑动回弹)。
  const canGoNext = !isSameMonth(visibleMonth, today);
  canNextRef.current = canGoNext;

  // 视口高度跟随居中月份的实际行数;拖动按比例插值、滑动用过渡,下方记录区随之平滑升降、不跳动。
  const hPrev = panelHeight(months[0], today);
  const hCur = panelHeight(months[1], today);
  const hNext = panelHeight(months[2], today);
  let viewportHeight = hCur;
  if (animating) {
    viewportHeight = step === 2 ? hNext : step === 0 ? hPrev : hCur;
  } else if (dragX < 0) {
    viewportHeight = hCur + (hNext - hCur) * Math.min(1, -dragX / (widthRef.current || 1));
  } else if (dragX > 0) {
    viewportHeight = hCur + (hPrev - hCur) * Math.min(1, dragX / (widthRef.current || 1));
  }

  return (
    <section className={styles.CalendarCard.Root}>
      <div className={styles.CalendarCard.MonthRow}>
        <button
          className={styles.CalendarCard.MonthButton}
          type='button'
          data-test-id={Calendar.previousMonth}
          aria-label={localize('calendar.previousMonth', 'Previous month')}
          onClick={() => slideTo(0)}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <h1 className={styles.CalendarCard.MonthTitle}>
          {format(visibleMonth, localize('calendar.monthTitleFormat', 'MMMM yyyy'), { locale })}
        </h1>
        <button
          className={styles.CalendarCard.MonthButton}
          type='button'
          data-test-id={Calendar.nextMonth}
          aria-label={localize('calendar.nextMonth', 'Next month')}
          disabled={!canGoNext}
          onClick={() => slideTo(2)}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
        <button
          className={styles.CalendarCard.TodayButton}
          type='button'
          data-test-id={Calendar.today}
          onClick={selectToday}
        >
          {localize('calendar.today', 'Today')}
        </button>
      </div>
      <div className={styles.CalendarCard.WeekRow} aria-hidden='true'>
        {WEEKDAY_DATES.map((date) => (
          <span key={date.toISOString()}>{format(date, 'EEEEE', { locale })}</span>
        ))}
      </div>
      <div
        ref={viewportRef}
        className={styles.CalendarCard.SliderViewport}
        style={{
          height: viewportHeight,
          transition: animating
            ? `height ${SLIDE_DURATION}ms cubic-bezier(0.22,0.61,0.36,1)`
            : 'none',
        }}
      >
        <div
          className={styles.CalendarCard.SliderTrack}
          style={{
            transform: `translateX(calc(${-PANEL_STEP * step}% + ${dragX}px))`,
            transition: animating
              ? `transform ${SLIDE_DURATION}ms cubic-bezier(0.22,0.61,0.36,1)`
              : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {months.map((month, index) => {
            const activePanel = index === 1;
            return (
              <div
                key={dateKey(startOfMonth(month))}
                className={styles.CalendarCard.SliderPanel}
                aria-hidden={!activePanel}
              >
                <MonthGrid
                  month={month}
                  today={today}
                  selectedDate={selectedDate}
                  recordsByDate={recordsByDate}
                  onSelect={onSelectDate}
                  activePanel={activePanel}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
