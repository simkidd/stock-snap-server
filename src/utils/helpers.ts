export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};

export const formatDate = (date: number | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(value);
};