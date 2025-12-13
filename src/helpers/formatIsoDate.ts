export function normalizeDate(dateStr: string): Date {
  const iso = dateStr.replace(" ", "T");

  return new Date(`${iso}+08:00`);
}

export function toLocalDBTime(date: Date): Date {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

export function parseLocalToUTC(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const local = new Date(year, month - 1, day, hour, minute, 0);

  return new Date(local.getTime() - local.getTimezoneOffset() * 60000);
}
