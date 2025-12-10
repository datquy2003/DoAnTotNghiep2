export const getMondayOfWeek = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(d);
  monday.setUTCDate(diff);
  return monday.toISOString().split("T")[0];
};