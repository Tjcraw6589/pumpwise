import { formatClock, localClock, openState, weekRows } from '@/lib/hours';
import { isBritishSummerTime, REGIONS } from '@/lib/regions';

const WEEK = (day: string) => [day, day, day, day, day, day, day];
const PERTH = 8 * 60;

describe('local clocks', () => {
  test('British Summer Time runs from the last Sunday in March to the last Sunday in October', () => {
    expect(isBritishSummerTime(new Date('2026-03-29T00:59:00Z'))).toBe(false);
    expect(isBritishSummerTime(new Date('2026-03-29T01:00:00Z'))).toBe(true);
    expect(isBritishSummerTime(new Date('2026-10-25T00:59:00Z'))).toBe(true);
    expect(isBritishSummerTime(new Date('2026-10-25T01:00:00Z'))).toBe(false);
    expect(REGIONS.uk.utcOffsetMinutes(new Date('2026-07-01T12:00:00Z'))).toBe(60);
    expect(REGIONS.wa.utcOffsetMinutes(new Date('2026-07-01T12:00:00Z'))).toBe(480);
  });
  test('gives the local weekday (Monday = 0), minutes past midnight and date', () => {
    expect(localClock(new Date('2026-07-01T12:00:00Z'), 60)).toEqual({ day: 2, minutes: 13 * 60, dateKey: '2026-07-01' });
    // 20:00 UTC on Wednesday is 04:00 Thursday in Perth.
    expect(localClock(new Date('2026-10-28T20:00:00Z'), PERTH)).toEqual({ day: 3, minutes: 4 * 60, dateKey: '2026-10-29' });
  });
  test('formats minutes as a 24-hour clock', () => {
    expect(formatClock(390)).toBe('06:30');
    expect(formatClock(1440)).toBe('00:00');
  });
});

describe('openState', () => {
  // Wednesday 2 December 2026, 12:00 in Perth.
  const noon = new Date('2026-12-02T04:00:00Z');

  test('24 hours and normal hours', () => {
    expect(openState(WEEK('24h'), noon, PERTH)).toEqual({ status: 'open', label: 'Open 24 hours' });
    expect(openState(WEEK('0600-2200'), noon, PERTH)).toEqual({ status: 'open', label: 'Open until 22:00' });
  });
  test('before opening and after closing', () => {
    expect(openState(WEEK('1300-2200'), noon, PERTH)).toEqual({ status: 'closed', label: 'Closed · opens 13:00' });
    expect(openState(WEEK('0600-1100'), noon, PERTH)).toEqual({ status: 'closed', label: 'Closed · opens tomorrow 06:00' });
  });
  test('a shift that runs past midnight', () => {
    const lateNight = new Date('2026-12-02T17:00:00Z'); // Thursday 01:00 in Perth
    expect(openState(WEEK('1800-0300'), lateNight, PERTH)).toEqual({ status: 'open', label: 'Open until 03:00' });
  });
  test('closed days look ahead to the next opening', () => {
    const hours = ['0700-1900', '0700-1900', 'closed', 'closed', '0800-1800', '0800-1800', '0800-1800'];
    expect(openState(hours, noon, PERTH)).toEqual({ status: 'closed', label: 'Closed · opens Friday 08:00' });
  });
  test('the same moment can be open in one place and closed in another', () => {
    const hours = WEEK('0600-2200');
    const moment = new Date('2026-12-02T23:00:00Z'); // 07:00 in Perth, 23:00 in London
    expect(openState(hours, moment, PERTH).status).toBe('open');
    expect(openState(hours, moment, 0).status).toBe('closed');
  });
  test('unknown hours say nothing', () => {
    expect(openState(null, noon, PERTH)).toEqual({ status: 'unknown', label: '' });
    expect(openState(WEEK('unknown'), noon, PERTH)).toEqual({ status: 'unknown', label: '' });
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
