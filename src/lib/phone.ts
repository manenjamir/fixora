export function normalizePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return `+${digits}`;
}

export function formatPhone(input?: string | null) {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length >= 12) return `+91 ${digits.slice(2)}`;
  if (digits.length === 10) return `+91 ${digits}`;
  return input.trim();
}
