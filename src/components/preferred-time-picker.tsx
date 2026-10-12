import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const TIME_SLOTS = Array.from({ length: 13 }, (_, index) => ({ hour: 8 + index, minute: 0 }));

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function upcomingDays() {
  const today = startOfDay(new Date());
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

function timeLabel(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

function sameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function PreferredTimePicker({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (value: Date | null) => void;
}) {
  const [day, setDay] = useState(() => startOfDay(value ?? new Date()));
  const selectedSlot = TIME_SLOTS.find(
    (slot) => value != null && sameDay(value, day) && value.getHours() === slot.hour && value.getMinutes() === slot.minute,
  );

  return (
    <View className="gap-5 overflow-hidden rounded-2xl border border-slate-200/60 bg-white px-5 py-6 dark:border-slate-800/80 dark:bg-slate-900">
      <View className="gap-2">
        <Text className="text-lg font-bold text-slate-900 dark:text-white">When should the professional arrive?</Text>
        <Text className="text-sm font-medium text-slate-500">Service will take approx. 45 mins</Text>
      </View>

      <View className="flex-row" style={{ gap: 8 }}>
        {upcomingDays().map((date) => {
          const selected = sameDay(date, day);
          return (
            <Pressable
              key={date.toISOString()}
              accessibilityRole="button"
              onPress={() => {
                setDay(date);
                if (!selectedSlot || !value) return;
                const next = new Date(date);
                next.setHours(value.getHours(), value.getMinutes(), 0, 0);
                onChange(next);
              }}
              style={{ flex: 1, height: 92 }}
              className={`items-center justify-center rounded-2xl border ${
                selected
                  ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'
              }`}>
              <Text className={`text-center text-sm font-medium ${selected ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500'}`}>
                {date.toLocaleDateString('en-IN', { weekday: 'short' })}
              </Text>
              <Text className={`text-center text-2xl font-semibold ${selected ? 'text-violet-700 dark:text-violet-200' : 'text-slate-900 dark:text-white'}`}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="text-base font-bold text-slate-900 dark:text-white" style={{ marginBottom: 16 }}>
        Select start time of service
      </Text>
      <View className="flex-row flex-wrap justify-between" style={{ rowGap: 8 }}>
        {TIME_SLOTS.map((slot) => {
          const selected = selectedSlot?.hour === slot.hour && selectedSlot.minute === slot.minute;
          return (
            <Pressable
              key={`${slot.hour}:${slot.minute}`}
              accessibilityRole="button"
              onPress={() => {
                const next = new Date(day);
                next.setHours(slot.hour, slot.minute, 0, 0);
                onChange(next);
              }}
              style={{ width: '31%' }}
              className={`min-h-[68px] items-center justify-center rounded-2xl border px-2 py-6 ${
                selected
                  ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'
              }`}>
              <Text
                className={`text-center text-base font-medium ${
                  selected ? 'text-violet-700 dark:text-violet-200' : 'text-slate-800 dark:text-slate-100'
                }`}>
                {timeLabel(slot.hour, slot.minute)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
