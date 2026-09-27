import type { Href } from 'expo-router';

import type { Job } from '@/context/job-store';

export function customerJobHref(job: Job): Href {
  if (job.status === 'quoted') {
    return `/(customer)/estimate/${job.id}`;
  }
  if (job.status === 'warehouse' || job.status === 'out_for_delivery' || job.status === 'delivered') {
    return `/(customer)/warehouse/${job.id}`;
  }
  return `/(customer)/track/${job.id}`;
}

export function isActiveJob(job: Job) {
  return ![
    'declined_by_customer',
    'declined_by_technician',
    'on_site_repaired',
    'delivered',
  ].includes(job.status);
}
