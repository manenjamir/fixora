export function formatPreferredAt(value?: number) {
  if (!value) return 'No preferred time';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function isUnacceptedSlotOver(job: { status: string; preferredAt?: number }) {
  return job.status === 'requested' && job.preferredAt != null && job.preferredAt < Date.now();
}

export function isExpiredBooking(job: { status: string; preferredAt?: number }) {
  return job.status === 'expired' || isUnacceptedSlotOver(job);
}
