import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DeviceCategoryId, PlaceTag } from '@/constants/devices';

export type AppRole = 'customer' | 'tech';

export type JobStatus =
  | 'requested'
  | 'dispatched'
  | 'inspecting'
  | 'quoted'
  | 'accepted'
  | 'declined'
  | 'on_site_repaired'
  | 'warehouse'
  | 'delivered';

export type RepairTier = 'a1' | 'a2' | 'a3';

export type JobTiers = {
  a1: number;
  a2: number;
  a3: number;
};

export type Job = {
  id: string;
  category: DeviceCategoryId;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  placeTag: PlaceTag;
  address: string;
  status: JobStatus;
  diagnosis?: string;
  tiers?: JobTiers;
  chosenTier?: RepairTier;
  loanerRequested: boolean;
  loanerType?: 'phone' | 'laptop';
  partsInStock: boolean;
  partsChecked: boolean;
  technician: { lat: number; lng: number; etaMinutes: number };
  createdAt: number;
};

type CreateJobInput = {
  category: DeviceCategoryId;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  placeTag: PlaceTag;
  address: string;
};

type JobContextValue = {
  role: AppRole | null;
  setRole: (role: AppRole | null) => void;
  jobs: Job[];
  getJob: (id: string) => Job | undefined;
  createJob: (input: CreateJobInput) => Job;
  setPartsCheck: (id: string, inStock: boolean) => void;
  startDispatch: (id: string) => void;
  startInspection: (id: string) => void;
  sendQuote: (id: string, diagnosis: string, tiers: JobTiers) => void;
  chooseTier: (id: string, tier: RepairTier) => void;
  declineRepair: (id: string) => void;
  resolveJob: (id: string, status: 'on_site_repaired' | 'warehouse' | 'declined') => void;
  requestLoaner: (id: string, loanerType: 'phone' | 'laptop') => void;
};

const JobContext = createContext<JobContextValue | null>(null);

const SEED_JOB: Job = {
  id: 'job-demo',
  category: 'laptops',
  placeTag: 'Hostel',
  address: 'Block C, University Hostel, Gate 2',
  status: 'dispatched',
  loanerRequested: false,
  partsInStock: true,
  partsChecked: true,
  technician: { lat: 28.5355, lng: 77.391, etaMinutes: 18 },
  createdAt: Date.now() - 90_000,
};

export const TIER_COPY: Record<RepairTier, { title: string; warranty: string }> = {
  a1: { title: 'A1 · OEM', warranty: '6 months warranty' },
  a2: { title: 'A2 · First copy', warranty: '3 months warranty' },
  a3: { title: 'A3 · Quick fix', warranty: 'No warranty' },
};

export const STATUS_LABEL: Record<JobStatus, string> = {
  requested: 'Finding technician',
  dispatched: 'Technician on the way',
  inspecting: 'Free check-up in progress',
  quoted: 'Repair estimate ready',
  accepted: 'Repair approved',
  declined: 'Repair declined',
  on_site_repaired: 'Repaired on-site',
  warehouse: 'In warehouse',
  delivered: 'Delivered',
};

export function JobProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [jobs, setJobs] = useState<Job[]>([SEED_JOB]);

  const patchJob = useCallback((id: string, updater: (job: Job) => Job) => {
    setJobs((current) => current.map((job) => (job.id === id ? updater(job) : job)));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setJobs((current) =>
        current.map((job) => {
          if (job.status !== 'dispatched' || job.technician.etaMinutes <= 1) return job;
          return {
            ...job,
            technician: {
              lat: job.technician.lat + 0.0012,
              lng: job.technician.lng + 0.0008,
              etaMinutes: job.technician.etaMinutes - 1,
            },
          };
        }),
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const getJob = useCallback((id: string) => jobs.find((job) => job.id === id), [jobs]);

  const createJob = useCallback((input: CreateJobInput) => {
    const job: Job = {
      id: `job-${Date.now()}`,
      category: input.category,
      mediaUri: input.mediaUri,
      mediaType: input.mediaType,
      placeTag: input.placeTag,
      address: input.address,
      status: 'requested',
      loanerRequested: false,
      partsInStock: true,
      partsChecked: false,
      technician: { lat: 28.52, lng: 77.38, etaMinutes: 22 },
      createdAt: Date.now(),
    };
    setJobs((current) => [job, ...current]);
    return job;
  }, []);

  const setPartsCheck = useCallback(
    (id: string, inStock: boolean) => {
      patchJob(id, (job) => ({ ...job, partsChecked: true, partsInStock: inStock }));
    },
    [patchJob],
  );

  const startDispatch = useCallback(
    (id: string) => {
      patchJob(id, (job) => ({
        ...job,
        status: 'dispatched',
        technician: { ...job.technician, etaMinutes: job.technician.etaMinutes || 20 },
      }));
    },
    [patchJob],
  );

  const startInspection = useCallback(
    (id: string) => {
      patchJob(id, (job) => ({ ...job, status: 'inspecting' }));
    },
    [patchJob],
  );

  const sendQuote = useCallback(
    (id: string, diagnosis: string, tiers: JobTiers) => {
      patchJob(id, (job) => ({ ...job, status: 'quoted', diagnosis, tiers }));
    },
    [patchJob],
  );

  const chooseTier = useCallback(
    (id: string, tier: RepairTier) => {
      patchJob(id, (job) => ({ ...job, status: 'accepted', chosenTier: tier }));
    },
    [patchJob],
  );

  const declineRepair = useCallback(
    (id: string) => {
      patchJob(id, (job) => ({ ...job, status: 'declined', chosenTier: undefined }));
    },
    [patchJob],
  );

  const resolveJob = useCallback(
    (id: string, status: 'on_site_repaired' | 'warehouse' | 'declined') => {
      patchJob(id, (job) => ({ ...job, status }));
    },
    [patchJob],
  );

  const requestLoaner = useCallback(
    (id: string, loanerType: 'phone' | 'laptop') => {
      patchJob(id, (job) => ({ ...job, loanerRequested: true, loanerType }));
    },
    [patchJob],
  );

  const value = useMemo(
    () => ({
      role,
      setRole,
      jobs,
      getJob,
      createJob,
      setPartsCheck,
      startDispatch,
      startInspection,
      sendQuote,
      chooseTier,
      declineRepair,
      resolveJob,
      requestLoaner,
    }),
    [
      role,
      jobs,
      getJob,
      createJob,
      setPartsCheck,
      startDispatch,
      startInspection,
      sendQuote,
      chooseTier,
      declineRepair,
      resolveJob,
      requestLoaner,
    ],
  );

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export function useJobs() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used inside JobProvider');
  }
  return context;
}

export function formatRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}
