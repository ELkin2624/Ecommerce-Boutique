/**
 * Formatea un monto numérico o texto a formato de moneda local (Bs.)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const numericValue =
    typeof amount === 'number'
      ? amount
      : typeof amount === 'string'
        ? parseFloat(amount)
        : 0;

  const safeAmount = Number.isFinite(numericValue) ? numericValue : 0;
  return `Bs. ${safeAmount.toFixed(2)}`;
}
