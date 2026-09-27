import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';

type JobMediaPreviewProps = {
  uri: string;
  mediaType?: 'image' | 'video';
};

function JobVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });

  return (
    <VideoView
      style={styles.media}
      player={player}
      nativeControls
      contentFit="cover"
      fullscreenOptions={{ enable: true }}
    />
  );
}

export function JobMediaPreview({ uri, mediaType }: JobMediaPreviewProps) {
  if (mediaType === 'video') {
    return <JobVideoPreview uri={uri} />;
  }

  return <Image source={{ uri }} style={styles.media} contentFit="cover" />;
}

const styles = StyleSheet.create({
  media: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
