export function formatPreferredAt(value?: number) {
  if (!value) return 'No preferred time';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
