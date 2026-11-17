/**
 * Comprehensive Time Formatting Utilities for 12-Hour (AM/PM) Display
 */

/**
 * Converts any 24-hour time string ("15:00", "19:30", "09:00", "23:45", "00:00")
 * or standard time string into human-friendly 12-hour format with AM/PM
 * (e.g. "3:00 PM", "7:30 PM", "9:00 AM", "11:45 PM", "12:00 AM").
 */
export function formatTimeTo12Hour(timeStr?: string | null): string {
  if (!timeStr || !timeStr.trim()) return '--:--';
  const clean = timeStr.trim();

  // If already formatted with AM / PM (case-insensitive)
  if (/am|pm/i.test(clean)) {
    return clean.toUpperCase();
  }

  // Match standard "HH:MM", "H:MM", or "HH:MM:SS"
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    if (isNaN(hours)) return clean;

    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;

    return `${hours}:${minutes} ${period}`;
  }

  // If string contains time like "15:00:00" or ISO timestamps
  const isoMatch = clean.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) {
    let hours = parseInt(isoMatch[1], 10);
    const minutes = isoMatch[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${period}`;
  }

  return clean;
}

/**
 * Formats a time range (e.g. "15:00", "19:00" -> "3:00 PM - 7:00 PM")
 */
export function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return '--:--';
  if (start && !end) return formatTimeTo12Hour(start);
  if (!start && end) return formatTimeTo12Hour(end);
  return `${formatTimeTo12Hour(start)} - ${formatTimeTo12Hour(end)}`;
}
