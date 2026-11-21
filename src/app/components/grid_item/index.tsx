import { Image, Text, TouchableOpacity, View } from 'react-native';
import styles from './styles';

type GridItemProps = {
  title: string;
  description: string;
  image: string;
  onPress?: () => void;
};

export default function GridItem({ title, description, image, onPress }: GridItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View>
      <Image source={{ uri: image }} style={styles.image} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
