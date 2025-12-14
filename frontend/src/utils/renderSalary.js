import { formatCurrency } from "./formatCurrency";

export const renderSalary = (min, max) => {
  const toNumberOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const minNum = toNumberOrNull(min);
  const maxNum = toNumberOrNull(max);

  const hasMin = minNum != null && minNum > 0;
  const hasMax = maxNum != null && maxNum > 0;

  if (!hasMin && !hasMax) return "Thỏa thuận";
  if (hasMin && !hasMax) return `Từ ${formatCurrency(minNum)}`;
  if (!hasMin && hasMax) return `Lên đến ${formatCurrency(maxNum)}`;
  return `${formatCurrency(minNum)} - ${formatCurrency(maxNum)}`;
};