export function eventDate(occurrence, options = {}) {
  if (!occurrence?.startsAtUtc || !occurrence?.timeZone) return 'Date to check';
  const date = new Date(occurrence.startsAtUtc);
  if (Number.isNaN(date.getTime())) return 'Date to check';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: occurrence.timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(options.includeTime ? {weekday: 'long', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'} : {}),
  }).format(date);
}
