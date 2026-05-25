const holidayCache = new Map<string, Set<string>>();

export function createHolidayCacheKey(countryCode: string, year: number): string {
  return `${countryCode}-${year}`;
}

export function getCachedHolidayDates(cacheKey: string): Set<string> | null {
  return holidayCache.get(cacheKey) || null;
}

export function setCachedHolidayDates(cacheKey: string, holidayDates: Set<string>): void {
  holidayCache.set(cacheKey, holidayDates);
}

export function clearHolidayCache(): void {
  holidayCache.clear();
}

export function cleanOldHolidayCache(currentYear = new Date().getFullYear()): void {
  const keysToDelete: string[] = [];

  for (const key of holidayCache.keys()) {
    const year = parseInt(key.split('-')[1]);

    if (year < currentYear - 2 || year > currentYear + 3) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => holidayCache.delete(key));
}
