import { endOfMonth, getDay, isAfter, isSameMonth, startOfMonth } from 'date-fns';

export const WEEKDAY_DATES = Array.from({ length: 7 }, (_, index) => new Date(2026, 5, 14 + index));
/** 滑动切换月份的动画时长(毫秒)。 */
export const SLIDE_DURATION = 280;
/** 三块面板的轨道里,单块面板占轨道的比例(1/3)。 */
export const PANEL_STEP = 100 / 3;
/** 单行日期格高度(px):上下 padding 6 + 日期圆圈 30 + 圆点行 8。 */
const ROW_HEIGHT = 44;
/** DayGrid 行间距(gap-y-1)。 */
const ROW_GAP = 4;
/** 高度下限的行数:避免月初当月仅一两行时日历过矮。 */
const MIN_ROWS = 3;

export interface CalendarDayCell {
  key: string;
  date?: Date;
}

// 当月只渲染到“今天所在周”,过去月渲染完整周,未来月不渲染日期;高度因此随内容自适应。
function visibleRows(month: Date, today: Date): number {
  const first = startOfMonth(month);
  if (isAfter(first, today)) return 0;
  const prefix = getDay(first);
  const lastDay = isSameMonth(month, today) ? today.getDate() : endOfMonth(month).getDate();
  return Math.ceil((prefix + lastDay) / 7);
}

// 居中月份的视口高度:按实际渲染行数算,并兜底 MIN_ROWS 行,避免月初过矮。
export function panelHeight(month: Date, today: Date): number {
  const rows = visibleRows(month, today);
  const content = rows > 0 ? rows * ROW_HEIGHT + (rows - 1) * ROW_GAP : 0;
  return Math.max(content, MIN_ROWS * ROW_HEIGHT + (MIN_ROWS - 1) * ROW_GAP);
}

export function buildCalendarCells(month: Date, today: Date): CalendarDayCell[] {
  const first = startOfMonth(month);
  const prefix = getDay(first);
  const dayCount = endOfMonth(month).getDate();
  const total = visibleRows(month, today) * 7;
  const cells: CalendarDayCell[] = [];

  for (let index = 0; index < prefix && cells.length < total; index++) {
    cells.push({ key: `pre-${index}` });
  }
  for (let day = 1; day <= dayCount && cells.length < total; day++) {
    cells.push({ key: `day-${day}`, date: new Date(first.getFullYear(), first.getMonth(), day) });
  }
  while (cells.length < total) {
    cells.push({ key: `post-${cells.length}` });
  }

  return cells;
}
