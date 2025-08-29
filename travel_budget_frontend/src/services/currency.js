const DEFAULT_CCY = process.env.REACT_APP_DEFAULT_CURRENCY || "USD";

// PUBLIC_INTERFACE
export function formatMoney(amount, currency = DEFAULT_CCY) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

// PUBLIC_INTERFACE
export function sum(arr, selector = (x) => x) {
  return (arr || []).reduce((acc, x) => acc + Number(selector(x) || 0), 0);
}
