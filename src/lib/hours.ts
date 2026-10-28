/**
 * Opening hours, worked out in UK time (GMT in winter, BST in summer) whatever time zone the
 * phone is set to, because forecourts publish their hours in UK local time.
 */

/** Last Sunday of a month at 01:00 UTC, when the UK clocks change. */
function lastSundayUtc(year: number, monthIndex: number): number {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0, 1));
  return lastDay.getTime() - lastDay.getUTCDay() * 86_400_000;
}

export function isBritishSummerTime(date: Date): boolean {
  const year = date.getUTCFullYear();
  const t = date.getTime();
  return t >= lastSundayUtc(year, 2) && t < lastSundayUtc(year, 9);
}

/** Day of week (0 = Monday) and minutes past midnight in the UK. */
export function ukClock(date: Date): { day: number; minutes: number } {
  const local = new Date(date.getTime() + (isBritishSummerTime(date) ? 3_600_000 : 0));
  return { day: (local.getUTCDay() + 6) % 7, minutes: local.getUTCHours() * 60 + local.getUTCMinutes() };
}

interface Span {
  open: number;
  close: number;
}

function parseDay(value: string | undefined): Span | '24h' | 'closed' | null {
  if (!value || value === 'unknown') return null;
  if (value === '24h' || value === 'closed') return value;
  const match = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    open: Number(match[1]) * 60 + Number(match[2]),
    close: Number(match[3]) * 60 + Number(match[4]),
  };
}

export function formatClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export type OpenStatus = 'open' | 'closed' | 'unknown';

export interface OpenState {
  status: OpenStatus;
  /** "Open 24 hours", "Open until 22:00", "Closed · opens 06:00", or "" when unknown. */
  label: string;
}

export function openState(hours: string[] | null, date: Date): OpenState {
  if (!hours) return { status: 'unknown', label: '' };
  const { day, minutes } = ukClock(date);
  const today = parseDay(hours[day]);
  const yesterday = parseDay(hours[(day + 6) % 7]);

  // Still open from a shift that started yesterday and runs past midnight.
  if (yesterday && typeof yesterday === 'object' && yesterday.close < yesterday.open && minutes < yesterday.close) {
    return { status: 'open', label: `Open until ${formatClock(yesterday.close)}` };
  }
  if (today === null) return { status: 'unknown', label: '' };
  if (today === '24h') return { status: 'open', label: 'Open 24 hours' };
  if (today === 'closed') return { status: 'closed', label: nextOpening(hours, day) };

  const overnight = today.close < today.open;
  const open = overnight ? minutes >= today.open : minutes >= today.open && minutes < today.close;
  if (open) return { status: 'open', label: `Open until ${formatClock(today.close)}` };
  if (minutes < today.open) return { status: 'closed', label: `Closed · opens ${formatClock(today.open)}` };
  return { status: 'closed', label: nextOpening(hours, day) };
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function nextOpening(hours: string[], today: number): string {
  for (let offset = 1; offset <= 7; offset++) {
    const index = (today + offset) % 7;
    const day = parseDay(hours[index]);
    if (day === null) return 'Closed now';
    if (day === 'closed') continue;
    const when = offset === 1 ? 'tomorrow' : DAY_NAMES[index];
    if (day === '24h') return `Closed · opens ${when}`;
    return `Closed · opens ${when} ${formatClock(day.open)}`;
  }
  return 'Closed';
}

/** Rows for the station screen: "Monday" → "06:00–22:00". */
export function weekRows(hours: string[] | null): { day: string; text: string }[] {
  if (!hours) return [];
  return DAY_NAMES.map((day, i) => {
    const parsed = parseDay(hours[i]);
    const text =
      parsed === null
        ? 'Not given'
        : parsed === '24h'
          ? '24 hours'
          : parsed === 'closed'
            ? 'Closed'
            : `${formatClock(parsed.open)}–${formatClock(parsed.close)}`;
    return { day, text };
  });
}
