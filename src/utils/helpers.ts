export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

export const formatDate = (date: number | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Generates a unique invoice number with date and sequence.
 * @returns {string} The generated invoice number.
 */
export function generateInvoiceNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format
  const randomSequence = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase(); // Generate a 6-character alphanumeric string
  return `INV-${date}-${randomSequence}`;
}
