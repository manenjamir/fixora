import { useRouter } from 'expo-router';
import { Navigation, Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Content, TabScreen, TabScrollView } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useJobs, type Job } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Contact = { name?: string; phone?: string };
type Section = 'upcoming' | 'completed' | 'cancelled';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const COMPLETED = new Set(['on_site_repaired', 'delivered']);
const CANCELLED = new Set(['declined_by_customer', 'declined_by_technician']);

function sectionFor(job: Job): Section {
  if (CANCELLED.has(job.status)) return 'cancelled';
  if (COMPLETED.has(job.status)) return 'completed';
  return 'upcoming';
}

function whenFor(job: Job, section: Section) {
  if (section === 'completed') return job.completedAt ?? job.preferredAt ?? job.updatedAt;
  if (section === 'cancelled') return job.updatedAt;
  return job.preferredAt ?? job.createdAt;
}

function startOfDay(time: number) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function dayLabel(time: number) {
  const day = startOfDay(time);
  const today = startOfDay(Date.now());
  const diff = Math.round((day - today) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Date(time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function timeLabel(time: number) {
  return new Date(time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export default function TechOngoingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const { jobs } = useJobs();
  const [section, setSection] = useState<Section>('upcoming');
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const mine = jobs.filter((job) => job.technicianId === session?.user.id);
  const visible = mine
    .filter((job) => sectionFor(job) === section)
    .sort((left, right) => {
      const direction = section === 'upcoming' ? 1 : -1;
      return (whenFor(left, section) - whenFor(right, section)) * direction;
    });
  const customerIds = [...new Set(mine.map((job) => job.customerId))].join(',');

  useEffect(() => {
    const ids = customerIds ? customerIds.split(',') : [];
    if (ids.length === 0) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', ids)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setContacts(
          Object.fromEntries(
            data.map((profile) => [profile.id, { name: profile.full_name ?? undefined, phone: profile.phone ?? undefined }]),
          ),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [customerIds]);

  let lastDay = '';

  return (
    <TabScreen>
      <TabScrollView>
        <Content>
          <View style={[styles.tabs, { borderBottomColor: theme.backgroundElement }]}>
            {SECTIONS.map((item) => {
              const selected = item.id === section;
              return (
                <Pressable key={item.id} accessibilityRole="button" onPress={() => setSection(item.id)} style={styles.tab}>
                  <ThemedText type="smallBold" style={{ color: selected ? theme.text : theme.textSecondary }}>
                    {item.label}
                  </ThemedText>
                  <View style={[styles.underline, { backgroundColor: selected ? theme.text : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <ThemedText themeColor="textSecondary">No {section} jobs.</ThemedText>
          ) : (
            visible.map((job) => {
              const when = whenFor(job, section);
              const label = dayLabel(when);
              const showDay = label !== lastDay;
              lastDay = label;
              const contact = contacts[job.customerId];
              return (
                <View key={job.id} style={styles.group}>
                  {showDay ? <ThemedText type="smallBold">{label}</ThemedText> : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/(tech)/job/${job.id}`)}
                    style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                    <View style={styles.cardBody}>
                      <ThemedText type="smallBold">{timeLabel(when)}</ThemedText>
                      <ThemedText themeColor="textSecondary" numberOfLines={1}>
                        {contact?.name || 'Customer'} · {job.address}
                      </ThemedText>
                    </View>
                    <View style={styles.actions}>
                      {contact?.phone ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Call customer"
                          onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                          style={[styles.action, { backgroundColor: theme.background }]}>
                          <Phone size={18} color={theme.text} />
                        </Pressable>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Navigate"
                        onPress={() => {
                          if (job.customerLocation) {
                            const { lat, lng } = job.customerLocation;
                            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                            return;
                          }
                          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`);
                        }}
                        style={[styles.action, { backgroundColor: theme.background }]}>
                        <Navigation size={18} color={theme.text} />
                      </Pressable>
                    </View>
                  </Pressable>
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  underline: {
    height: 2,
    alignSelf: 'stretch',
  },
  group: {
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 16,
  },
  cardBody: {
    flex: 1,
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
