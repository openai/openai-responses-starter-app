// Date and time utility functions for Cal.com booking

export interface ParsedDateTime {
  localDateTime: Date;
  utcDateTime: string;
  timezone: string;
}

/**
 * Parse natural language date/time input and convert to proper Cal.com format
 */
export function parseDateTime(
  dateInput: string,
  timeInput: string,
  timezone: string
): ParsedDateTime {
  // Get current date in the specified timezone
  const now = new Date();
  
  // Parse date input
  let targetDate: Date;
  
  if (dateInput.toLowerCase().includes('tomorrow')) {
    targetDate = new Date(now);
    targetDate.setDate(now.getDate() + 1);
  } else if (dateInput.toLowerCase().includes('today')) {
    targetDate = new Date(now);
  } else {
    // Try to parse as a regular date
    targetDate = new Date(dateInput);
    if (isNaN(targetDate.getTime())) {
      throw new Error(`Unable to parse date: ${dateInput}`);
    }
  }
  
  // Parse time input (e.g., "10 AM", "10:00", "10:30 AM")
  const timeMatch = timeInput.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!timeMatch) {
    throw new Error(`Unable to parse time: ${timeInput}`);
  }
  
  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2] || '0');
  const ampm = timeMatch[3]?.toLowerCase();
  
  // Convert to 24-hour format
  if (ampm === 'pm' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'am' && hours === 12) {
    hours = 0;
  }
  
  // Set the time
  targetDate.setHours(hours, minutes, 0, 0);
  
  // Convert timezone string to a format we can work with
  const normalizedTimezone = normalizeTimezone(timezone);
  
  // Create a date string in the target timezone and then parse as UTC
  const utcDateTime = convertToUTC(targetDate, normalizedTimezone);
  
  return {
    localDateTime: targetDate,
    utcDateTime: utcDateTime,
    timezone: normalizedTimezone
  };
}

/**
 * Normalize timezone input to standard IANA format
 */
function normalizeTimezone(timezone: string): string {
  const tzMap: { [key: string]: string } = {
    'est': 'America/New_York',
    'eastern': 'America/New_York',
    'et': 'America/New_York',
    'pst': 'America/Los_Angeles',
    'pacific': 'America/Los_Angeles',
    'pt': 'America/Los_Angeles',
    'mst': 'America/Denver',
    'mountain': 'America/Denver',
    'mt': 'America/Denver',
    'cst': 'America/Chicago',
    'central': 'America/Chicago',
    'ct': 'America/Chicago',
  };
  
  const lowerTz = timezone.toLowerCase().trim();
  return tzMap[lowerTz] || timezone;
}

/**
 * Convert local date/time to UTC string format required by Cal.com
 */
function convertToUTC(localDate: Date, timezone: string): string {
  try {
    // Create a date formatter for the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(localDate);
    const partsObj = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as any);
    
    // Create a new date in the target timezone
    const tzDate = new Date(
      `${partsObj.year}-${partsObj.month}-${partsObj.day}T${partsObj.hour}:${partsObj.minute}:${partsObj.second}`
    );
    
    // Get the timezone offset for this date
    const utcTime = tzDate.getTime() + (tzDate.getTimezoneOffset() * 60000);
    
    // Calculate the timezone offset for the target timezone
    const tempDate = new Date(utcTime);
    const targetTzOffset = getTimezoneOffset(timezone, tempDate);
    
    // Apply the timezone offset
    const utcDate = new Date(utcTime - (targetTzOffset * 60000));
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting to UTC:', error);
    // Fallback: just use the local date as UTC
    return localDate.toISOString();
  }
}

/**
 * Get timezone offset in minutes for a specific timezone and date
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0; // Default to UTC
  }
}

/**
 * Format date for display
 */
export function formatDisplayDate(date: Date, timezone: string): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    return date.toString();
  }
}