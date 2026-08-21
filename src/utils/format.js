export function formatPrice(value, showCurrency = true, decimals = 0) {
  const num = Number(value);
  if (isNaN(num)) return value;
  const formatted = num.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showCurrency ? `$${formatted}` : formatted;
}
