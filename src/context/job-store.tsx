import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth';
import type { DeviceCategoryId, PlaceTag } from '@/constants/devices';
import { distanceMeters, etaMinutes, type Coordinates } from '@/lib/geo';
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

export type RepairLocation = 'on_site' | 'warehouse';

export const REPAIR_LOCATION_COPY: Record<RepairLocation, string> = {
  on_site: 'On-Site Repair',
  warehouse: 'Warehouse Repair',
};

export function isRepairLocation(value: string | null | undefined): value is RepairLocation {
  return value === 'on_site' || value === 'warehouse';
}

export type JobTiers = {
  a1: number;
  a2: number;
  a3: number;
};

export type JobMediaInput = {
  uri: string;
  mediaType: 'image' | 'video';
  mediaBase64?: string;
};

export type Job = {
  id: string;
  customerId: string;
  technicianId?: string;
  category: DeviceCategoryId;
  mediaPath?: string;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  completionMediaUri?: string;
  completionMediaType?: 'image' | 'video';
  placeTag: PlaceTag;
  address: string;
  status: JobStatus;
  diagnosis?: string;
  tiers?: JobTiers;
  chosenTier?: RepairTier;
  repairLocation?: RepairLocation;
  customerIssue?: string;
  deviceBrand?: string;
  estimatedCompletion: string;
  customerLocation?: Coordinates;
  technician: { lat?: number; lng?: number; etaMinutes?: number };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

type CreateJobInput = {
  category: DeviceCategoryId;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  mediaBase64?: string;
  placeTag: PlaceTag;
  address: string;
  customerIssue: string;
  deviceBrand: string;
  customerLocation?: Coordinates;
};

type JobContextValue = {
  role: AppRole | null;
  deviceLocation: Coordinates | null;
  jobs: Job[];
  getJob: (id: string) => Job | undefined;
  createJob: (input: CreateJobInput) => Promise<Job>;
  startDispatch: (id: string) => Promise<void>;
  startInspection: (id: string) => Promise<void>;
  sendQuote: (id: string, diagnosis: string, tiers: JobTiers, repairLocation: RepairLocation) => Promise<void>;
  chooseTier: (id: string, tier: RepairTier) => Promise<void>;
  declineRepair: (id: string) => Promise<void>;
  resolveJob: (id: string, status: 'warehouse' | 'declined_by_technician') => Promise<void>;
  completeOnSite: (id: string, media?: JobMediaInput) => Promise<void>;
  markReadyToShip: (id: string) => Promise<void>;
  markDelivered: (id: string, media?: JobMediaInput) => Promise<void>;
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
  const completionMediaUri = await signedMediaUri(row.completion_media_path);
  const tiers =
    row.price_a1 != null && row.price_a2 != null && row.price_a3 != null
      ? { a1: Number(row.price_a1), a2: Number(row.price_a2), a3: Number(row.price_a3) }
      : undefined;

  return {
    id: row.id,
    customerId: row.customer_id,
    technicianId: row.technician_id ?? undefined,
    category: row.category as DeviceCategoryId,
    mediaPath: row.media_path ?? undefined,
    mediaUri,
    mediaType: row.media_type === 'video' ? 'video' : row.media_type === 'image' ? 'image' : undefined,
    completionMediaUri,
    completionMediaType:
      row.completion_media_type === 'video' ? 'video' : row.completion_media_type === 'image' ? 'image' : undefined,
    placeTag: row.place_tag as PlaceTag,
    address: row.address,
    status: isJobStatus(row.status) ? row.status : 'requested',
    diagnosis: row.diagnosis ?? undefined,
    tiers,
    chosenTier: row.chosen_tier === 'a1' || row.chosen_tier === 'a2' || row.chosen_tier === 'a3' ? row.chosen_tier : undefined,
    repairLocation: isRepairLocation(row.repair_location) ? row.repair_location : undefined,
    customerIssue: row.customer_issue ?? undefined,
    deviceBrand: row.device_brand ?? undefined,
    estimatedCompletion: row.estimated_completion || '1-2 days',
    customerLocation:
      row.customer_lat != null && row.customer_lng != null
        ? { lat: row.customer_lat, lng: row.customer_lng }
        : undefined,
    technician: {
      lat: row.tech_lat ?? undefined,
      lng: row.tech_lng ?? undefined,
      etaMinutes: row.eta_minutes ?? undefined,
    },
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
  };
}

function sameAsideFromLocation(job: Job, row: JobRow) {
  const status = isJobStatus(row.status) ? row.status : job.status;
  const tier =
    row.chosen_tier === 'a1' || row.chosen_tier === 'a2' || row.chosen_tier === 'a3' ? row.chosen_tier : undefined;
  return (
    job.status === status &&
    job.address === row.address &&
    job.placeTag === row.place_tag &&
    (job.diagnosis ?? null) === (row.diagnosis ?? null) &&
    (job.technicianId ?? null) === (row.technician_id ?? null) &&
    (job.chosenTier ?? null) === (tier ?? null) &&
    (job.repairLocation ?? null) === (isRepairLocation(row.repair_location) ? row.repair_location : null) &&
    (job.mediaPath ?? null) === (row.media_path ?? null) &&
    (job.customerIssue ?? null) === (row.customer_issue ?? null) &&
    (job.deviceBrand ?? null) === (row.device_brand ?? null) &&
    (job.tiers?.a1 ?? null) === (row.price_a1 == null ? null : Number(row.price_a1)) &&
    (job.tiers?.a2 ?? null) === (row.price_a2 == null ? null : Number(row.price_a2)) &&
    (job.tiers?.a3 ?? null) === (row.price_a3 == null ? null : Number(row.price_a3)) &&
    (job.completedAt ?? null) === (row.completed_at ? new Date(row.completed_at).getTime() : null) &&
    job.estimatedCompletion === row.estimated_completion
  );
}

function withLocation(job: Job, row: JobRow): Job {
  return {
    ...job,
    customerLocation:
      row.customer_lat != null && row.customer_lng != null
        ? { lat: row.customer_lat, lng: row.customer_lng }
        : undefined,
    technician: {
      lat: row.tech_lat ?? undefined,
      lng: row.tech_lng ?? undefined,
      etaMinutes: row.eta_minutes ?? undefined,
    },
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

async function uploadMedia(
  userId: string,
  jobId: string,
  uri: string,
  mediaType: 'image' | 'video',
  mediaBase64?: string,
  fileName = 'issue',
) {
  const extension = mediaType === 'video' ? 'mp4' : 'jpg';
  const path = `${userId}/${jobId}/${fileName}.${extension}`;
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
  const [deviceLocation, setDeviceLocation] = useState<Coordinates | null>(null);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
        const row = payload.new as JobRow | null;
        const current = row ? jobsRef.current.find((job) => job.id === row.id) : undefined;
        if (payload.eventType === 'UPDATE' && row && current && sameAsideFromLocation(current, row)) {
          setJobs((previous) => previous.map((job) => (job.id === row.id ? withLocation(job, row) : job)));
          return;
        }
        refreshJobs().catch(() => undefined);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, refreshJobs]);

  useEffect(() => {
    if (role !== 'tech' || !session?.user.id) {
      setDeviceLocation(null);
      return;
    }

    const userId = session.user.id;
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;
    let lastSentAt = 0;
    let lastLat: number | undefined;
    let lastLng: number | undefined;

    Location.requestForegroundPermissionsAsync()
      .then((permission) => {
        if (!permission.granted || cancelled) return;
        return Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 15 },
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setDeviceLocation({ lat, lng });
            const moved =
              lastLat == null || lastLng == null ? Number.POSITIVE_INFINITY : distanceMeters({ lat: lastLat, lng: lastLng }, { lat, lng });
            if (lastSentAt !== 0 && Date.now() - lastSentAt < 10_000 && moved < 25) return;

            const traveling = jobsRef.current.filter(
              (job) =>
                job.technicianId === userId && (job.status === 'dispatched' || job.status === 'out_for_delivery'),
            );
            if (traveling.length === 0) return;

            lastSentAt = Date.now();
            lastLat = lat;
            lastLng = lng;
            for (const job of traveling) {
              const minutes = job.customerLocation
                ? etaMinutes(distanceMeters({ lat, lng }, job.customerLocation))
                : null;
              void supabase.rpc('update_tech_location', {
                job_id: job.id,
                lat,
                lng,
                eta_minutes: minutes,
              });
            }
          },
        );
      })
      .then((next) => {
        if (cancelled) {
          next?.remove();
          return;
        }
        subscription = next;
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [role, session?.user.id]);

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
          customer_issue: input.customerIssue,
          device_brand: input.deviceBrand,
          customer_lat: input.customerLocation?.lat,
          customer_lng: input.customerLocation?.lng,
          status: 'requested',
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

  const startDispatch = useCallback(
    (id: string) =>
      updateJob(id, {
        status: 'dispatched',
        technician_id: session?.user.id,
      }),
    [session?.user.id, updateJob],
  );

  const startInspection = useCallback((id: string) => updateJob(id, { status: 'inspecting' }), [updateJob]);

  const sendQuote = useCallback(
    (id: string, diagnosis: string, tiers: JobTiers, repairLocation: RepairLocation) =>
      updateJob(id, {
        status: 'quoted',
        diagnosis,
        price_a1: tiers.a1,
        price_a2: tiers.a2,
        price_a3: tiers.a3,
        repair_location: repairLocation,
      }),
    [updateJob],
  );

  const attachCompletion = useCallback(
    async (id: string, media?: JobMediaInput) => {
      if (!media) return {};
      const job = jobsRef.current.find((item) => item.id === id);
      if (!job) throw new Error('Job not found');
      const path = await uploadMedia(job.customerId, id, media.uri, media.mediaType, media.mediaBase64, 'completion');
      return {
        completion_media_path: path,
        completion_media_type: media.mediaType,
      };
    },
    [],
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
    (id: string, status: 'warehouse' | 'declined_by_technician') => updateJob(id, { status }),
    [updateJob],
  );

  const completeOnSite = useCallback(
    async (id: string, media?: JobMediaInput) => {
      const mediaValues = await attachCompletion(id, media);
      await updateJob(id, {
        status: 'on_site_repaired',
        completed_at: new Date().toISOString(),
        ...mediaValues,
      });
    },
    [attachCompletion, updateJob],
  );

  const markReadyToShip = useCallback((id: string) => updateJob(id, { status: 'out_for_delivery' }), [updateJob]);

  const markDelivered = useCallback(
    async (id: string, media?: JobMediaInput) => {
      const mediaValues = await attachCompletion(id, media);
      await updateJob(id, {
        status: 'delivered',
        completed_at: new Date().toISOString(),
        ...mediaValues,
      });
    },
    [attachCompletion, updateJob],
  );

  const value = useMemo(
    () => ({
      role,
      deviceLocation,
      jobs,
      getJob,
      createJob,
      startDispatch,
      startInspection,
      sendQuote,
      chooseTier,
      declineRepair,
      resolveJob,
      completeOnSite,
      markReadyToShip,
      markDelivered,
    }),
    [
      role,
      deviceLocation,
      jobs,
      getJob,
      createJob,
      startDispatch,
      startInspection,
      sendQuote,
      chooseTier,
      declineRepair,
      resolveJob,
      completeOnSite,
      markReadyToShip,
      markDelivered,
    ],
  );

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

type DatabaseUpdate = {
  status?: JobStatus;
  technician_id?: string;
  diagnosis?: string;
  price_a1?: number;
  price_a2?: number;
  price_a3?: number;
  chosen_tier?: RepairTier | null;
  repair_location?: RepairLocation;
  completed_at?: string;
  completion_media_path?: string;
  completion_media_type?: 'image' | 'video';
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
