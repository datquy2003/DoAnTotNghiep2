export const isSameVNDay = (a, b) => {
  if (!a || !b) return false;
  const fmt = (d) =>
    d.toLocaleDateString("vi-VN", {
      timeZone: "UTC",
    });
  return fmt(a) === fmt(b);
};