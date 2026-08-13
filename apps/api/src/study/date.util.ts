/**
 * Timezone-aware "today" boundary, computed without an extra date library.
 * Assumption (see CLAUDE.md "Dates are evaluated in the user's timezone"):
 * a review's due date is compared against local midnight in the user's
 * stored timezone (default Asia/Seoul), not the server's local time.
 */
export function startOfTodayInTimezone(timezone: string, reference: Date = new Date()): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(reference)
      .map((part) => [part.type, part.value]),
  );

  // Treat the reference instant's wall-clock time in `timezone` as if it
  // were UTC, so subtracting the real UTC instant yields that timezone's
  // current offset (DST-aware, since it's derived from `reference`).
  const wallClockAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMs = wallClockAsUtc - reference.getTime();

  const localMidnightAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return new Date(localMidnightAsUtc - offsetMs);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Formats a due-date instant as a plain `YYYY-MM-DD` string (see API_CONTRACT.md). */
export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
