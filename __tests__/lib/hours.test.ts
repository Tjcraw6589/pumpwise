import { formatClock, isBritishSummerTime, openState, ukClock, weekRows } from '@/lib/hours';

const WEEK = (day: string) => [day, day, day, day, day, day, day];

describe('UK clock', () => {
  test('British Summer Time runs from the last Sunday in March to the last Sunday in October', () => {
    expect(isBritishSummerTime(new Date('2026-03-29T00:59:00Z'))).toBe(false);
    expect(isBritishSummerTime(new Date('2026-03-29T01:00:00Z'))).toBe(true);
    expect(isBritishSummerTime(new Date('2026-10-25T00:59:00Z'))).toBe(true);
    expect(isBritishSummerTime(new Date('2026-10-25T01:00:00Z'))).toBe(false);
  });
  test('gives the UK weekday (Monday = 0) and minutes past midnight', () => {
    expect(ukClock(new Date('2026-07-01T12:00:00Z'))).toEqual({ day: 2, minutes: 13 * 60 }); // Wednesday, BST
    expect(ukClock(new Date('2026-12-06T23:30:00Z'))).toEqual({ day: 6, minutes: 23 * 60 + 30 }); // Sunday, GMT
  });
  test('formats minutes as a 24-hour clock', () => {
    expect(formatClock(390)).toBe('06:30');
    expect(formatClock(1440)).toBe('00:00');
  });
});

describe('openState', () => {
  const wednesdayNoon = new Date('2026-12-02T12:00:00Z');

  test('24 hours and normal hours', () => {
    expect(openState(WEEK('24h'), wednesdayNoon)).toEqual({ status: 'open', label: 'Open 24 hours' });
    expect(openState(WEEK('0600-2200'), wednesdayNoon)).toEqual({ status: 'open', label: 'Open until 22:00' });
  });
  test('before opening and after closing', () => {
    expect(openState(WEEK('1300-2200'), wednesdayNoon)).toEqual({ status: 'closed', label: 'Closed · opens 13:00' });
    expect(openState(WEEK('0600-1100'), wednesdayNoon)).toEqual({ status: 'closed', label: 'Closed · opens tomorrow 06:00' });
  });
  test('a shift that runs past midnight', () => {
    const lateNight = new Date('2026-12-03T01:00:00Z'); // Thursday 01:00
    expect(openState(WEEK('1800-0300'), lateNight)).toEqual({ status: 'open', label: 'Open until 03:00' });
    expect(openState(WEEK('1800-0300'), new Date('2026-12-02T19:00:00Z'))).toEqual({ status: 'open', label: 'Open until 03:00' });
  });
  test('closed days look ahead to the next opening', () => {
    const hours = ['0700-1900', '0700-1900', 'closed', 'closed', '0800-1800', '0800-1800', '0800-1800'];
    expect(openState(hours, wednesdayNoon)).toEqual({ status: 'closed', label: 'Closed · opens Friday 08:00' });
  });
  test('unknown hours say nothing', () => {
    expect(openState(null, wednesdayNoon)).toEqual({ status: 'unknown', label: '' });
    expect(openState(WEEK('unknown'), wednesdayNoon)).toEqual({ status: 'unknown', label: '' });
  });
});

describe('weekRows', () => {
  test('lists every day', () => {
    const rows = weekRows(['0600-2200', '24h', 'closed', 'unknown', '0600-2200', '0600-2200', '0600-2200']);
    expect(rows[0]).toEqual({ day: 'Monday', text: '06:00–22:00' });
    expect(rows[1]?.text).toBe('24 hours');
    expect(rows[2]?.text).toBe('Closed');
    expect(rows[3]?.text).toBe('Not given');
    expect(weekRows(null)).toEqual([]);
  });
});
