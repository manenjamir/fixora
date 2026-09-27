import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth';
import type { DeviceCategoryId, PlaceTag } from '@/constants/devices';
import { readFileBytes } from '@/lib/read-file';
import { supabase } from '@/lib/supabase';
import type { JobRow } from '@/types/database';

export type AppRole = 'customer' | 'tech';

export type JobStatus =
  | 'requested'
  | 'dispatched'
  | 'inspecting'
  | 'quoted'
  | 'accepted'
  | 'declined_by_customer'
  | 'declined_by_technician'
  | 'on_site_repaired'
  | 'warehouse'
  | 'out_for_delivery'
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
  mediaPath?: string;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  placeTag: PlaceTag;
  address: string;
  status: JobStatus;
  diagnosis?: string;
  tiers?: JobTiers;
  chosenTier?: RepairTier;
  estimatedCompletion: string;
  partsInStock: boolean;
  partsChecked: boolean;
  technician: { lat: number; lng: number; etaMinutes: number };
  createdAt: number;
};

type CreateJobInput = {
  category: DeviceCategoryId;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  mediaBase64?: string;
  placeTag: PlaceTag;
  address: string;
};

type JobContextValue = {
  role: AppRole | null;
  jobs: Job[];
  getJob: (id: string) => Job | undefined;
  createJob: (input: CreateJobInput) => Promise<Job>;
  setPartsCheck: (id: string, inStock: boolean) => Promise<void>;
  startDispatch: (id: string) => Promise<void>;
  startInspection: (id: string) => Promise<void>;
  sendQuote: (id: string, diagnosis: string, tiers: JobTiers) => Promise<void>;
  chooseTier: (id: string, tier: RepairTier) => Promise<void>;
  declineRepair: (id: string) => Promise<void>;
  resolveJob: (id: string, status: 'on_site_repaired' | 'warehouse' | 'declined_by_technician') => Promise<void>;
  markReadyToShip: (id: string) => Promise<void>;
  markDelivered: (id: string) => Promise<void>;
};

const JobContext = createContext<JobContextValue | null>(null);

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
  declined_by_customer: 'Declined by Customer',
  declined_by_technician: 'Declined by Technician',
  on_site_repaired: 'Repaired on-site',
  warehouse: 'In warehouse',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

export const DECLINE_STATUSES: JobStatus[] = ['declined_by_customer', 'declined_by_technician'];

function isJobStatus(value: string): value is JobStatus {
  return value in STATUS_LABEL;
}

function decodeBase64(value: string) {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function blobToDataUri(blob: Blob) {
  return await new Promise<string | undefined>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(blob);
  });
}

async function signedMediaUri(path: string | null) {
  if (!path) return undefined;
  const { data, error } = await supabase.storage.from('job-media').createSignedUrl(path, 60 * 60);
  if (!error && data?.signedUrl) return data.signedUrl;

  const downloaded = await supabase.storage.from('job-media').download(path);
  if (downloaded.error || !downloaded.data) return undefined;
  return blobToDataUri(downloaded.data);
}

async function mapRow(row: JobRow): Promise<Job> {
  const mediaUri = await signedMediaUri(row.media_path);
  const tiers =
    row.price_a1 != null && row.price_a2 != null && row.price_a3 != null
      ? { a1: Number(row.price_a1), a2: Number(row.price_a2), a3: Number(row.price_a3) }
      : undefined;

  return {
    id: row.id,
    category: row.category as DeviceCategoryId,
    mediaPath: row.media_path ?? undefined,
    mediaUri,
    mediaType: row.media_type === 'video' ? 'video' : row.media_type === 'image' ? 'image' : undefined,
    placeTag: row.place_tag as PlaceTag,
    address: row.address,
    status: isJobStatus(row.status) ? row.status : 'requested',
    diagnosis: row.diagnosis ?? undefined,
    tiers,
    chosenTier: row.chosen_tier === 'a1' || row.chosen_tier === 'a2' || row.chosen_tier === 'a3' ? row.chosen_tier : undefined,
    estimatedCompletion: row.estimated_completion || '1-2 days',
    partsInStock: row.parts_in_stock,
    partsChecked: row.parts_checked,
    technician: {
      lat: row.tech_lat ?? 28.52,
      lng: row.tech_lng ?? 77.38,
      etaMinutes: row.eta_minutes ?? 22,
    },
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function uploadMedia(
  userId: string,
  jobId: string,
  uri: string,
  mediaType: 'image' | 'video',
  mediaBase64?: string,
) {
  const extension = mediaType === 'video' ? 'mp4' : 'jpg';
  const path = `${userId}/${jobId}/issue.${extension}`;
  const contentType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';

  let body: Uint8Array | Blob;
  if (mediaBase64) {
    body = decodeBase64(mediaBase64);
  } else {
    body = await readFileBytes(uri);
  }

  const { error } = await supabase.storage.from('job-media').upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export function JobProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  const role = (profile?.role === 'tech' || profile?.role === 'customer' ? profile.role : null) as AppRole | null;

  const refreshJobs = useCallback(async () => {
    if (!session) {
      setJobs([]);
      return;
    }
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const mapped = await Promise.all((data ?? []).map(mapRow));
    setJobs(mapped);
  }, [session]);

  useEffect(() => {
    refreshJobs().catch(() => setJobs([]));
  }, [refreshJobs]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('jobs-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        refreshJobs().catch(() => undefined);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, refreshJobs]);

  useEffect(() => {
    if (role !== 'tech') return;
    const timer = setInterval(async () => {
      const moving = jobsRef.current.filter((job) => job.status === 'dispatched' && job.technician.etaMinutes > 1);
      await Promise.all(
        moving.map((job) =>
          supabase
            .from('jobs')
            .update({
              tech_lat: job.technician.lat + 0.0012,
              tech_lng: job.technician.lng + 0.0008,
              eta_minutes: job.technician.etaMinutes - 1,
            })
            .eq('id', job.id),
        ),
      );
    }, 4000);
    return () => clearInterval(timer);
  }, [role]);

  const getJob = useCallback((id: string) => jobs.find((job) => job.id === id), [jobs]);

  const updateJob = useCallback(async (id: string, values: DatabaseUpdate) => {
    const { error } = await supabase.from('jobs').update(values).eq('id', id);
    if (error) throw error;
    await refreshJobs();
  }, [refreshJobs]);

  const createJob = useCallback(
    async (input: CreateJobInput) => {
      if (!session?.user.id) throw new Error('Sign in to book a technician');
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          customer_id: session.user.id,
          category: input.category,
          place_tag: input.placeTag,
          address: input.address,
          status: 'requested',
          tech_lat: 28.52,
          tech_lng: 77.38,
          eta_minutes: 22,
          estimated_completion: '1-2 days',
        })
        .select('*')
        .single();
      if (error || !data) throw error ?? new Error('Could not create job');

      if (input.mediaUri && input.mediaType) {
        const mediaPath = await uploadMedia(
          session.user.id,
          data.id,
          input.mediaUri,
          input.mediaType,
          input.mediaBase64,
        );
        const { error: mediaError } = await supabase
          .from('jobs')
          .update({ media_path: mediaPath, media_type: input.mediaType })
          .eq('id', data.id);
        if (mediaError) throw mediaError;
      }

      const { data: fresh, error: freshError } = await supabase.from('jobs').select('*').eq('id', data.id).single();
      if (freshError || !fresh) throw freshError ?? new Error('Could not load job');
      await refreshJobs();
      return mapRow(fresh);
    },
    [refreshJobs, session?.user.id],
  );

  const setPartsCheck = useCallback(
    (id: string, inStock: boolean) => updateJob(id, { parts_checked: true, parts_in_stock: inStock }),
    [updateJob],
  );

  const startDispatch = useCallback(
    (id: string) =>
      updateJob(id, {
        status: 'dispatched',
        technician_id: session?.user.id,
        eta_minutes: 20,
      }),
    [session?.user.id, updateJob],
  );

  const startInspection = useCallback((id: string) => updateJob(id, { status: 'inspecting' }), [updateJob]);

  const sendQuote = useCallback(
    (id: string, diagnosis: string, tiers: JobTiers) =>
      updateJob(id, {
        status: 'quoted',
        diagnosis,
        price_a1: tiers.a1,
        price_a2: tiers.a2,
        price_a3: tiers.a3,
      }),
    [updateJob],
  );

  const chooseTier = useCallback(
    (id: string, tier: RepairTier) => updateJob(id, { status: 'accepted', chosen_tier: tier }),
    [updateJob],
  );

  const declineRepair = useCallback(
    (id: string) => updateJob(id, { status: 'declined_by_customer', chosen_tier: null }),
    [updateJob],
  );

  const resolveJob = useCallback(
    (id: string, status: 'on_site_repaired' | 'warehouse' | 'declined_by_technician') => updateJob(id, { status }),
    [updateJob],
  );

  const markReadyToShip = useCallback((id: string) => updateJob(id, { status: 'out_for_delivery' }), [updateJob]);

  const markDelivered = useCallback((id: string) => updateJob(id, { status: 'delivered' }), [updateJob]);

  const value = useMemo(
    () => ({
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
      markReadyToShip,
      markDelivered,
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
      markReadyToShip,
      markDelivered,
    ],
  );

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

type DatabaseUpdate = {
  status?: JobStatus;
  technician_id?: string;
  parts_checked?: boolean;
  parts_in_stock?: boolean;
  diagnosis?: string;
  price_a1?: number;
  price_a2?: number;
  price_a3?: number;
  chosen_tier?: RepairTier | null;
  eta_minutes?: number;
  tech_lat?: number;
  tech_lng?: number;
  media_path?: string;
  media_type?: 'image' | 'video';
};

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
