import { BanknoteArrowDown, BanknoteArrowUp, ChevronLeft, ChevronRight, HandCoins, Star } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Content, TabScreen, TabScrollView } from '@/components/repair-ui';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { formatRupees, useJobs } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';
import { completedAmountInMonth, deductionFor } from '@/lib/earnings';
import { supabase } from '@/lib/supabase';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const PERIOD_MONTHS = 12;
const VISIBLE_MONTHS = 6;
const BAR_MAX = 108;

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function rollingMonths(year: number, month: number) {
  return Array.from({ length: PERIOD_MONTHS }, (_, index) => shiftMonth(year, month, index - (PERIOD_MONTHS - 1)));
}

export default function TechEarningsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { jobs } = useJobs();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [chartWidth, setChartWidth] = useState(0);
  const [ratings, setRatings] = useState<number[]>([]);
  const chartRef = useRef<ScrollView>(null);
  const technicianId = session?.user.id ?? '';
  const periodEnd = { year: now.getFullYear(), month: now.getMonth() };
  const chartMonths = rollingMonths(periodEnd.year, periodEnd.month);
  const periodStart = chartMonths[0];
  const atCurrentMonth = year === periodEnd.year && month === periodEnd.month;
  const atPeriodStart = year === periodStart.year && month === periodStart.month;
  const amounts = chartMonths.map((item) => completedAmountInMonth(jobs, technicianId, item.year, item.month));
  const peak = Math.max(...amounts, 0);
  const total = completedAmountInMonth(jobs, technicianId, year, month);
  const deductions = deductionFor(total);
  const net = total - deductions;
  const title = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const slotWidth = chartWidth > 0 ? chartWidth / VISIBLE_MONTHS : 0;
  const average = ratings.length === 0 ? 0 : ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  useEffect(() => {
    if (!technicianId) return;
    let cancelled = false;
    supabase
      .from('job_reviews')
      .select('rating')
      .eq('technician_id', technicianId)
      .then(({ data }) => {
        if (!cancelled) setRatings(data?.map((row) => row.rating) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [technicianId]);

  function scrollToSelection(animated: boolean) {
    if (slotWidth === 0) return;
    const index = chartMonths.findIndex((item) => item.year === year && item.month === month);
    if (index < 0) return;
    const maxOffset = slotWidth * (PERIOD_MONTHS - VISIBLE_MONTHS);
    const offset = Math.min(maxOffset, Math.max(0, slotWidth * (index - VISIBLE_MONTHS + 2)));
    chartRef.current?.scrollTo({ x: offset, animated });
  }

  useEffect(() => {
    scrollToSelection(true);
  }, [year, month, slotWidth]);

  function move(delta: number) {
    const next = shiftMonth(year, month, delta);
    const nextTime = next.year * 12 + next.month;
    const startTime = periodStart.year * 12 + periodStart.month;
    const endTime = periodEnd.year * 12 + periodEnd.month;
    if (nextTime < startTime || nextTime > endTime) return;
    setYear(next.year);
    setMonth(next.month);
  }

  return (
    <TabScreen>
      <TabScrollView>
        <Content>
          <ThemedText type="subtitle">Earnings</ThemedText>
          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              disabled={atPeriodStart}
              onPress={() => move(-1)}
              style={[styles.arrow, { borderColor: theme.backgroundSelected, opacity: atPeriodStart ? 0.35 : 1 }]}>
              <ChevronLeft size={20} color={theme.text} />
            </Pressable>
            <ThemedText type="smallBold">{title}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              disabled={atCurrentMonth}
              onPress={() => move(1)}
              style={[styles.arrow, { borderColor: theme.backgroundSelected, opacity: atCurrentMonth ? 0.35 : 1 }]}>
              <ChevronRight size={20} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.chartWindow} onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}>
            <ScrollView
              ref={chartRef}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartContent}>
              {chartMonths.map((item, index) => {
                const selected = item.year === year && item.month === month;
                const amount = amounts[index];
                const height = amount === 0 || peak === 0 ? BAR_MAX : Math.max(18, (amount / peak) * BAR_MAX);
                const barColor = amount === 0 ? '#F2F4F7' : selected ? '#059669' : '#34D399';
                return (
                  <Pressable
                    key={`${item.year}-${item.month}`}
                    accessibilityRole="button"
                    onPress={() => {
                      setYear(item.year);
                      setMonth(item.month);
                    }}
                    style={[styles.barSlot, slotWidth > 0 ? { width: slotWidth } : null]}>
                    <View style={[styles.bar, { height, backgroundColor: barColor }]} />
                    <ThemedText
                      type="small"
                      style={[
                        styles.monthLabel,
                        selected
                          ? { color: theme.text, borderBottomColor: theme.text }
                          : { color: theme.textSecondary, borderBottomColor: 'transparent' },
                      ]}>
                      {MONTHS[item.month]}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <SummaryRow
            icon={<BanknoteArrowDown size={22} color="#15803D" />}
            iconBackground="#E8F6EE"
            amount={formatRupees(total)}
            label="Total Earnings"
          />
          <View style={[styles.divider, { backgroundColor: theme.backgroundElement }]} />
          <SummaryRow
            icon={<BanknoteArrowUp size={22} color="#EA580C" />}
            iconBackground="#FFF1E8"
            amount={formatRupees(deductions)}
            label="Total Deductions"
          />
          <View style={[styles.divider, { backgroundColor: theme.backgroundElement }]} />
          <SummaryRow
            icon={<HandCoins size={22} color="#2563EB" />}
            iconBackground="#EEF3FF"
            amount={formatRupees(net)}
            label="Net Earnings"
          />
          <View style={[styles.rating, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
            <View style={styles.ratingBadge}>
              <Star size={22} color="#D97706" fill="#F5B301" strokeWidth={2} />
            </View>
            <View style={styles.ratingText}>
              <ThemedText themeColor="textSecondary">Overall rating</ThemedText>
              <ThemedText style={styles.ratingScore}>{ratings.length === 0 ? '—' : average.toFixed(1)}</ThemedText>
              <StarRating value={average} size={20} />
              <ThemedText themeColor="textSecondary">
                {ratings.length === 0 ? 'No ratings yet' : `${ratings.length} rating${ratings.length === 1 ? '' : 's'}`}
              </ThemedText>
            </View>
          </View>
        </Content>
      </TabScrollView>
    </TabScreen>
  );
}

function SummaryRow({
  icon,
  iconBackground,
  amount,
  label,
}: {
  icon: ReactNode;
  iconBackground: string;
  amount: string;
  label: string;
}) {
  return (
    <View style={styles.summary}>
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>{icon}</View>
      <View style={styles.summaryText}>
        <ThemedText type="smallBold">{amount}</ThemedText>
        <ThemedText themeColor="textSecondary">{label}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
  ratingBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7E6',
  },
  ratingText: {
    flex: 1,
    gap: 4,
  },
  ratingScore: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWindow: {
    height: 150,
  },
  chartContent: {
    alignItems: 'flex-end',
    height: 150,
  },
  barSlot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bar: {
    width: '70%',
    maxWidth: 28,
    borderRadius: 6,
  },
  monthLabel: {
    borderBottomWidth: 2,
    paddingBottom: 2,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
