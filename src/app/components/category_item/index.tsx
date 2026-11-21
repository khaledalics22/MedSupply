

import { View } from 'react-native';

import { Category, CategoryType } from '../../utils/types';
import GridItem from '../grid_item';
import styles from './styles';

export type CategoryItemProps = Omit<Category, 'id' | 'itemLayout'> & {
  id?: string;
  onPress: (category: CategoryType) => void;
};

export default function CategoryItem({ type, title, description, image, onPress }: CategoryItemProps) {
  return (
    <View style={styles.container}>
      <GridItem title={title} description={description} image={image} onPress={() => onPress(type)} />
    </View>
  );
}