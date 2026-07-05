export const getPersianWeekday = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';

  const isLeap = (year: number) => {
    const r = year % 33;
    return (
      r === 1 ||
      r === 5 ||
      r === 9 ||
      r === 13 ||
      r === 17 ||
      r === 22 ||
      r === 26 ||
      r === 30
    );
  };

  let days = 0;

  if (y >= 1400) {
    for (let i = 1400; i < y; i++) {
      days += isLeap(i) ? 366 : 365;
    }
  } else {
    for (let i = y; i < 1400; i++) {
      days -= isLeap(i) ? 366 : 365;
    }
  }

  for (let i = 1; i < m; i++) {
    if (i <= 6) days += 31;
    else if (i <= 11) days += 30;
  }

  days += d - 1;

  const weekdays = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه'
  ];

  let wd = days % 7;
  if (wd < 0) wd += 7;

  return weekdays[wd];
};
