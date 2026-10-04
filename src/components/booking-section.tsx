import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type SectionCardProps = {
  title: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
};

export function SectionCard({ title, hint, optional, children }: SectionCardProps) {
  return (
    <View className="gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-base font-bold text-slate-900 dark:text-white">{title}</Text>
        {optional ? (
          <Text className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-500 dark:bg-slate-800">
            Optional
          </Text>
        ) : null}
      </View>
      {hint ? <Text className="text-sm font-medium text-slate-500">{hint}</Text> : null}
      {children}
    </View>
  );
}

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`rounded-full border px-4 py-2.5 active:opacity-80 ${
        selected
          ? 'border-blue-600 bg-blue-600'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'
      }`}>
      <Text className={`text-base font-bold ${selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
