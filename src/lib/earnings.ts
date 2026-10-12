import type { Job, RepairTier } from '@/context/job-store';

const PAID = new Set(['on_site_repaired', 'delivered']);
const PENDING = new Set(['dispatched', 'inspecting', 'quoted', 'accepted', 'warehouse', 'out_for_delivery']);

export function chosenPrice(job: Job) {
  if (!job.chosenTier || !job.tiers) return 0;
  return job.tiers[job.chosenTier as RepairTier] ?? 0;
}

export const DEDUCTION_RATE = 0.2;

export function deductionFor(amount: number) {
  return Math.round(amount * DEDUCTION_RATE);
}

export function completedAmountInMonth(jobs: Job[], technicianId: string, year: number, month: number) {
  return jobs.reduce((total, job) => {
    if (job.technicianId !== technicianId || !PAID.has(job.status)) return total;
    const when = new Date(job.completedAt ?? job.updatedAt);
    if (when.getFullYear() !== year || when.getMonth() !== month) return total;
    return total + chosenPrice(job);
  }, 0);
}

export function earningsForYear(jobs: Job[], technicianId: string, year: number) {
  const mine = jobs.filter((job) => job.technicianId === technicianId);
  const months = Array.from({ length: 12 }, () => 0);
  let paid = 0;
  let pending = 0;
  let completed = 0;

  for (const job of mine) {
    const amount = chosenPrice(job);
    if (PAID.has(job.status)) {
      const when = job.completedAt ?? job.updatedAt;
      if (new Date(when).getFullYear() !== year) continue;
      months[new Date(when).getMonth()] += amount;
      paid += amount;
      completed += 1;
    } else if (PENDING.has(job.status)) {
      pending += amount;
    }
  }

  const years = new Set<number>();
  for (const job of mine) {
    if (!PAID.has(job.status)) continue;
    years.add(new Date(job.completedAt ?? job.updatedAt).getFullYear());
  }

  return {
    months,
    paid,
    pending,
    completed,
    average: completed === 0 ? 0 : Math.round(paid / completed),
    years: [...years].sort((a, b) => b - a),
  };
}
