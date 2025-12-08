export const getImageUrl = (url) => {
  if (!url) {
    return null;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("data:image/")) {
    return url;
  }
  return null;
};
