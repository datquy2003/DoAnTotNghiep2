export const formatCurrency = (amount, options = {}) => {
  const { showSymbol = true, fractionDigits = 0 } = options;

  if (amount === 0) return showSymbol ? "Miễn phí" : "0";

  const num = Number(amount);
  if (Number.isNaN(num)) return "";

  return new Intl.NumberFormat("vi-VN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "VND",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(num);
};