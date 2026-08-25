export function generateTimeOptions(start, end, stepMinutes) {
  const options = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let minutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  while (minutes <= endMinutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    const value = `${h}:${m}`;
    options.push({ label: value, value });
    minutes += stepMinutes;
  }
  return options;
}
