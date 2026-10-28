/**
 * Opening hours in the station's own local time, whatever time zone the phone is set to.
 * Each region supplies its UTC offset (Perth is always +8; the UK is +0 or +1 in summer).
 */

/** Day of week (0 = Monday) and minutes past midnight at a UTC offset. */
export function localClock(date: Date, offsetMinutes: number): { day: number; minutes: number; dateKey: string } {
  const local = new Date(date.getTime() + offsetMinutes * 60_000);
  return {
    day: (local.getUTCDay() + 6) % 7,
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
    dateKey: local.toISOString().slice(0, 10),
  };
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

export function openState(hours: string[] | null, date: Date, offsetMinutes: number): OpenState {
  if (!hours) return { status: 'unknown', label: '' };
  const { day, minutes } = localClock(date, offsetMinutes);
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
