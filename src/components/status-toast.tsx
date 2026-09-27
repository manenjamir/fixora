import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useJobs, type Job, type JobStatus } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';

function messageForChange(role: string | null | undefined, from: JobStatus | undefined, to: JobStatus) {
  if (from === to) return null;
  if (role !== 'tech' && to === 'dispatched') {
    return 'Technician is on the way to your location!';
  }
  if (to === 'inspecting') {
    return 'Free Checkup in Progress';
  }
  if (role !== 'tech' && to === 'out_for_delivery') {
    return 'Your device is ready and on its way back to your home!';
  }
  if (role !== 'tech' && to === 'delivered') {
    return 'Your device has been delivered. Enjoy!';
  }
  return null;
}

export function StatusToast() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { jobs } = useJobs();
  const previous = useRef<Record<string, JobStatus>>({});
  const primed = useRef(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (jobs.length === 0) {
      primed.current = false;
      previous.current = {};
      return;
    }
    if (!primed.current) {
      previous.current = Object.fromEntries(jobs.map((job) => [job.id, job.status]));
      primed.current = true;
      return;
    }
    const prev = previous.current;
    let nextMessage: string | null = null;
    jobs.forEach((job: Job) => {
      const last = prev[job.id];
      const text = messageForChange(profile?.role, last, job.status);
      if (text) nextMessage = text;
    });
    previous.current = Object.fromEntries(jobs.map((job) => [job.id, job.status]));
    if (nextMessage) setMessage(nextMessage);
  }, [jobs, profile?.role]);

  if (!message) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => setMessage(null)}>
      <Pressable style={styles.backdrop} onPress={() => setMessage(null)}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <ThemedText type="smallBold">{message}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Tap to dismiss
          </ThemedText>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
