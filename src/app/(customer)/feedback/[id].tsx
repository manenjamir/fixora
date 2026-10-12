import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useJobs } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const LABELS = ['', 'Poor', 'Fair', 'Okay', 'Good', 'Excellent'];
const FINISHED = new Set(['on_site_repaired', 'delivered']);

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const { getJob } = useJobs();
  const job = getJob(id ?? '');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const device = job ? getDevice(job.category) : undefined;

  if (!job || !job.technicianId || !FINISHED.has(job.status)) {
    return (
      <Screen>
        <ThemedText>Feedback is available after the repair is finished.</ThemedText>
      </Screen>
    );
  }

  async function submit() {
    if (!job?.technicianId || !session?.user.id) return;
    if (rating < 1) {
      Alert.alert('Choose a rating', 'Tap the stars before you submit.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('job_reviews').insert({
        job_id: job.id,
        customer_id: session.user.id,
        technician_id: job.technicianId,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      router.back();
    } catch (error) {
      Alert.alert('Could not send feedback', error instanceof Error ? error.message : 'Try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <View style={[styles.summary, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.summaryText}>
              <ThemedText type="smallBold">{device?.label}</ThemedText>
              <ThemedText themeColor="textSecondary">• {job.customerIssue || job.deviceBrand || 'Doorstep repair'}</ThemedText>
            </View>
          </View>

          <ThemedText type="smallBold" style={styles.question}>
            How would you rate the experience and service?
          </ThemedText>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} accessibilityRole="button" onPress={() => setRating(star)}>
                <Star size={36} color="#F5B301" fill={star <= rating ? '#F5B301' : 'transparent'} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
          <Text style={[styles.caption, { color: theme.textSecondary }]}>
            {rating > 0 ? `${rating} - ${LABELS[rating]}` : 'Tap a star'}
          </Text>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share how the visit went"
            placeholderTextColor={theme.textSecondary}
            multiline
            textAlignVertical="top"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <AppButton label={saving ? 'Sending…' : 'Submit Feedback'} disabled={saving} onPress={submit} />
        </Content>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  summary: {
    borderRadius: 16,
    padding: Spacing.three,
  },
  summaryText: {
    gap: Spacing.one,
  },
  question: {
    textAlign: 'center',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  caption: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    minHeight: 120,
    borderRadius: 16,
    padding: Spacing.three,
    fontSize: 16,
  },
});
