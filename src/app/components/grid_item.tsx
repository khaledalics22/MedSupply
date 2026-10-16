import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';

type GridItemProps = {
  title: string;
  image: string;
  onPress?: () => void;
};

export default function GridItem({ title, image, onPress }: GridItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: image }} style={styles.image} />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F6FA',
    borderRadius: 12,
    gap: 8,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
