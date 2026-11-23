import { Ionicons } from '@expo/vector-icons';
import { TextInput, TouchableOpacity, View } from 'react-native';

import styles from './styles';

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  onPress?: () => void;
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = 'rgba(255,255,255,0.85)',
  showFilterButton = false,
  onFilterPress,
  onPress, 
}: SearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.searchContainer} activeOpacity={0.8} onPress={onPress}>
        <Ionicons name="search" size={18} color="#fff" style={styles.icon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          style={styles.input}
        />
      </TouchableOpacity>
    
      {showFilterButton && (
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.8} onPress={onFilterPress}>
          <Ionicons name="options" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
