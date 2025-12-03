export function normalizeDate(dateStr: string): Date {
  const iso = dateStr.replace(" ", "T");

  return new Date(`${iso}+08:00`);
}
