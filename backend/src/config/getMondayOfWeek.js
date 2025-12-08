export const getMondayOfWeek = (date) => {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const day = vnTime.getUTCDay();

  const diff = vnTime.getUTCDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(vnTime);
  monday.setUTCDate(diff);
  return monday.toISOString().split("T")[0];
};