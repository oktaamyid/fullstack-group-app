const IDR_PER_CURRENCY = {
  IDR: 1,
  USD: 16400,
  SGD: 12800,
  EUR: 19000,
};

export function normalizeCurrency(currency = "IDR") {
  return Object.hasOwn(IDR_PER_CURRENCY, currency) ? currency : "IDR";
}

export function convertFromIdr(value, currency = "IDR") {
  const normalizedCurrency = normalizeCurrency(currency);
  const numericValue = Number(value) || 0;

  return numericValue / IDR_PER_CURRENCY[normalizedCurrency];
}

export function convertToIdr(value, currency = "IDR") {
  const normalizedCurrency = normalizeCurrency(currency);
  const numericValue = Number(value) || 0;

  return Math.round(numericValue * IDR_PER_CURRENCY[normalizedCurrency]);
}

export function formatCurrency(value, language = "id-ID", currency = "IDR") {
  const normalizedCurrency = normalizeCurrency(currency);
  const maximumFractionDigits = normalizedCurrency === "IDR" ? 0 : 2;
  const convertedValue = convertFromIdr(value, normalizedCurrency);

  return new Intl.NumberFormat(language || "id-ID", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits,
  }).format(convertedValue);
}

export function formatCurrencyValue(
  value,
  language = "id-ID",
  currency = "IDR",
) {
  const normalizedCurrency = normalizeCurrency(currency);
  const maximumFractionDigits = normalizedCurrency === "IDR" ? 0 : 2;

  return new Intl.NumberFormat(language || "id-ID", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits,
  }).format(Number(value) || 0);
}

export function formatCompactCurrency(
  value,
  language = "id-ID",
  currency = "IDR",
) {
  const normalizedCurrency = normalizeCurrency(currency);
  const convertedValue = convertFromIdr(value, normalizedCurrency);

  return new Intl.NumberFormat(language || "id-ID", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "IDR" ? 1 : 2,
    notation: "compact",
    compactDisplay: "short",
  }).format(convertedValue);
}

export { IDR_PER_CURRENCY };
