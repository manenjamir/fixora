import { Star } from 'lucide-react-native';
import { View } from 'react-native';

export function StarRating({ value, size = 18 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} color="#F5B301" fill={star <= filled ? '#F5B301' : 'transparent'} strokeWidth={2} />
      ))}
    </View>
  );
}
