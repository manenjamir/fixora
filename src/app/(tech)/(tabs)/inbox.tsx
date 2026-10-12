import { useRouter } from 'expo-router';
import { ChevronRight, Clock, MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { categoryIcon, Content, TabScreen, TabScrollView } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice, groupForCategory } from '@/constants/devices';
import { useAuth } from '@/context/auth';
import { useJobs } from '@/context/job-store';
import { formatPreferredAt } from '@/lib/schedule';

export default function TechJobsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { jobs } = useJobs();
  const specializations = profile?.specializations ?? [];
  const openJobs = jobs.filter(
    (job) =>
      job.status === 'requested' &&
      !job.technicianId &&
      specializations.includes(groupForCategory(job.category)),
  );

  return (
    <TabScreen>
      <TabScrollView>
        <Content>
          <ThemedText type="subtitle">Jobs</ThemedText>
          <ThemedText themeColor="textSecondary">Open visits that match your specializations.</ThemedText>
          {openJobs.length === 0 ? (
            <ThemedText themeColor="textSecondary">No open requests right now.</ThemedText>
          ) : (
            openJobs.map((job) => {
              const device = getDevice(job.category);
              const Icon = categoryIcon(job.category);
              return (
                <Pressable
                  key={job.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${device.label} job`}
                  onPress={() => router.push(`/(tech)/job/${job.id}`)}
                  className="gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 active:opacity-90 dark:border-slate-800 dark:bg-slate-900">
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800">
                      <Icon size={22} color="#2563EB" strokeWidth={2} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="text-base font-bold text-slate-900 dark:text-white">{device.label}</Text>
                      <Text className="text-sm font-medium text-slate-500">{job.deviceBrand || 'Brand not listed'}</Text>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                  </View>
                  {job.customerIssue ? (
                    <View className="gap-1">
                      <Text className="text-sm font-bold text-slate-500">Issue</Text>
                      <Text className="text-base text-slate-800 dark:text-slate-100" numberOfLines={2}>
                        {job.customerIssue}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-sm font-medium text-slate-500">No issue described</Text>
                  )}
                  <View className="gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <View className="flex-row items-center gap-2">
                      <MapPin size={15} color="#64748B" strokeWidth={2} />
                      <Text className="flex-1 text-sm text-slate-500" numberOfLines={1}>
                        {job.placeTag} · {job.address}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Clock size={15} color="#64748B" strokeWidth={2} />
                      <Text className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {formatPreferredAt(job.preferredAt)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </Content>
      </TabScrollView>
    </TabScreen>
  );
}
