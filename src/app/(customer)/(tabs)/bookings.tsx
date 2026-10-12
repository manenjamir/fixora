import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryIcon, Content, TabScreen, TabScrollView } from '@/components/repair-ui';
import { StarRating } from '@/components/star-rating';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { STATUS_LABEL, useJobs, type Job } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';
import { customerJobHref, isActiveJob } from '@/lib/job-routes';
import { supabase } from '@/lib/supabase';

type Section = 'upcoming' | 'previous';

function ordinal(day: number) {
  const mod = day % 100;
  if (mod >= 11 && mod <= 13) return `${day}th`;
  if (day % 10 === 1) return `${day}st`;
  if (day % 10 === 2) return `${day}nd`;
  if (day % 10 === 3) return `${day}rd`;
  return `${day}th`;
}

function whenFor(job: Job, section: Section) {
  if (section === 'previous') return job.completedAt ?? job.updatedAt;
  return job.preferredAt ?? job.createdAt;
}

function timeSlot(date: Date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

export default function CustomerJobsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const { jobs } = useJobs();
  const [section, setSection] = useState<Section>('upcoming');
  const [reviews, setReviews] = useState<Record<string, number>>({});
  const visible = jobs
    .filter((job) => (section === 'upcoming' ? isActiveJob(job) : !isActiveJob(job)))
    .sort((left, right) => {
      const direction = section === 'upcoming' ? 1 : -1;
      return (whenFor(left, section) - whenFor(right, section)) * direction;
    });

  useFocusEffect(
    useCallback(() => {
      if (!session?.user.id) return;
      let cancelled = false;
      supabase
        .from('job_reviews')
        .select('job_id, rating')
        .eq('customer_id', session.user.id)
        .then(({ data }) => {
          if (cancelled || !data) return;
          setReviews(Object.fromEntries(data.map((row) => [row.job_id, row.rating])));
        });
      return () => {
        cancelled = true;
      };
    }, [session?.user.id]),
  );

  return (
    <TabScreen>
      <TabScrollView>
        <Content>
          <Text style={[styles.title, { color: theme.text }]}>Bookings</Text>
          <View style={[styles.tabs, { backgroundColor: theme.backgroundElement }]}>
            {(['upcoming', 'previous'] as const).map((item) => {
              const selected = item === section;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() => setSection(item)}
                  style={[styles.tab, selected ? { backgroundColor: theme.background } : null]}>
                  <Text style={[styles.tabLabel, { color: selected ? theme.text : theme.textSecondary }]}>
                    {item === 'upcoming' ? 'Upcoming' : 'Previous'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {section === 'upcoming' ? 'No upcoming bookings yet.' : 'No previous bookings yet.'}
              </Text>
            </View>
          ) : (
            visible.map((job) => {
              const when = new Date(whenFor(job, section));
              const device = getDevice(job.category);
              const Icon = categoryIcon(job.category);
              const finished = (job.status === 'on_site_repaired' || job.status === 'delivered') && Boolean(job.technicianId);
              const open = () => router.push(section === 'upcoming' ? customerJobHref(job) : `/(customer)/history/${job.id}`);
              return (
                <View key={job.id} style={[styles.card, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
                  <View style={styles.top}>
                    <View style={[styles.dateTile, { backgroundColor: theme.backgroundElement }]}>
                      <Text style={[styles.day, { color: theme.text }]}>{ordinal(when.getDate())}</Text>
                      <Text style={[styles.month, { color: theme.textSecondary }]}>{when.toLocaleDateString('en-IN', { month: 'short' })}</Text>
                    </View>
                    <View style={styles.info}>
                      <View style={styles.serviceRow}>
                        <Icon size={18} color="#64748B" strokeWidth={2} />
                        <Text style={[styles.service, { color: theme.text }]} numberOfLines={1}>
                          {device.label}
                        </Text>
                      </View>
                      <Text style={[styles.when, { color: theme.textSecondary }]}>
                        {when.toLocaleDateString('en-IN', { weekday: 'long' })} · {timeSlot(when)}
                      </Text>
                      <View style={[styles.status, { backgroundColor: theme.backgroundElement }]}>
                        <Text style={[styles.statusText, { color: theme.textSecondary }]}>{STATUS_LABEL[job.status]}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.actions, { borderTopColor: theme.backgroundElement }]}>
                    {section === 'upcoming' ? (
                      <>
                        <Pressable accessibilityRole="button" onPress={open} style={styles.primary}>
                          <Text style={styles.primaryLabel}>Track</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => router.push({ pathname: '/(customer)/reschedule/[id]', params: { id: job.id } })}
                          style={[styles.secondary, { borderColor: theme.backgroundSelected }]}>
                          <Text style={[styles.link, { color: theme.text }]}>Reschedule</Text>
                        </Pressable>
                      </>
                    ) : finished ? (
                      <>
                        {reviews[job.id] ? (
                          <StarRating value={reviews[job.id]} />
                        ) : (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => router.push({ pathname: '/(customer)/feedback/[id]', params: { id: job.id } })}
                            style={styles.primary}>
                            <Text style={styles.primaryLabel}>Share Feedback</Text>
                          </Pressable>
                        )}
                        <Pressable accessibilityRole="button" onPress={open}>
                          <Text style={[styles.link, { color: theme.text }]}>View details</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Pressable accessibilityRole="button" onPress={open} style={styles.primary}>
                        <Text style={styles.primaryLabel}>View details</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </Content>
      </TabScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  empty: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  card: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  dateTile: {
    width: 72,
    height: 76,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    fontSize: 20,
    fontWeight: '700',
  },
  month: {
    fontSize: 13,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  service: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  when: {
    fontSize: 13,
    fontWeight: '500',
  },
  status: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  primary: {
    borderRadius: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  primaryLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondary: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
});
