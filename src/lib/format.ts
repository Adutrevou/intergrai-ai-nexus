// Locale-stable formatters to avoid SSR/CSR hydration mismatches.
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFmt.format(new Date(iso));
}
