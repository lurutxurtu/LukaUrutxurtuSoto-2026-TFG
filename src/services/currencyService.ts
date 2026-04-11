const CACHE_KEY = 'splitcount_exchange_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CachedRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export async function getExchangeRates(baseCurrency: string = 'EUR'): Promise<Record<string, number>> {
  const cached = getCachedRates(baseCurrency);
  if (cached) return cached;

  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    if (!response.ok) throw new Error('Error al obtener tasas de cambio');

    const data = await response.json();
    const rates: Record<string, number> = data.rates;
    saveCachedRates(baseCurrency, rates);
    return rates;
  } catch {
    const fallback = getCachedRates(baseCurrency, true);
    if (fallback) return fallback;
    return { [baseCurrency]: 1 };
  }
}

export async function convertCurrency(
  amount: number, fromCurrency: string, toCurrency: string
): Promise<{ convertedAmount: number; exchangeRate: number }> {
  if (fromCurrency === toCurrency) return { convertedAmount: amount, exchangeRate: 1 };
  const rates = await getExchangeRates(fromCurrency);
  const rate = rates[toCurrency] || 1;
  return { convertedAmount: Math.round(amount * rate * 100) / 100, exchangeRate: rate };
}

export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return 1;
  const rates = await getExchangeRates(fromCurrency);
  return rates[toCurrency] || 1;
}

function getCachedRates(baseCurrency: string, ignoreExpiry = false): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
    if (!raw) return null;
    const cached: CachedRates = JSON.parse(raw);
    if (!ignoreExpiry && Date.now() - cached.timestamp > CACHE_DURATION) return null;
    return cached.rates;
  } catch { return null; }
}

function saveCachedRates(baseCurrency: string, rates: Record<string, number>): void {
  try {
    const data: CachedRates = { base: baseCurrency, rates, timestamp: Date.now() };
    localStorage.setItem(`${CACHE_KEY}_${baseCurrency}`, JSON.stringify(data));
  } catch {}
}
