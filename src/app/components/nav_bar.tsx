import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type Tab = 'home' | 'search';

type NavBarProps = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

const ACTIVE_COLOR = '#208AEF';
const INACTIVE_COLOR = '#8E8E93';

const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'search', label: 'Search', icon: 'search' },
];

export default function NavBar({ active, onChange }: NavBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.row}>
        {tabs.map((tab) => {
          const color = active === tab.key ? ACTIVE_COLOR : INACTIVE_COLOR;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onChange(tab.key)}
              activeOpacity={0.7}>
              <Ionicons name={tab.icon} size={22} color={color} />
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  label: {
    fontSize: 12,
  },
});
