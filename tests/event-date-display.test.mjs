import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eventDate} from '../lib/event-date-display.mjs';

test('event dates follow the event zone across the international date line', () => {
  const startsAtUtc = '2026-10-31T00:30:00.000Z';
  assert.equal(eventDate({startsAtUtc, timeZone: 'America/Los_Angeles'}), 'Oct 30, 2026');
  assert.equal(eventDate({startsAtUtc, timeZone: 'Pacific/Honolulu'}), 'Oct 30, 2026');
  assert.equal(eventDate({startsAtUtc, timeZone: 'Asia/Tokyo'}), 'Oct 31, 2026');
  assert.match(eventDate({startsAtUtc, timeZone: 'America/Los_Angeles'}, {includeTime: true}), /Oct 30, 2026, 5:30 PM PDT/);
});
