import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageCode, t } from '../../i18n';
import styles from './styles';

export type Tab = 'home' | 'search' | 'orders' | 'profile';

type NavBarProps = {
  active: Tab;
  language: LanguageCode;
  onChange: (tab: Tab) => void;
  onLayoutHeight?: (height: number) => void;
};

const ACTIVE_COLOR = '#208AEF';
const INACTIVE_COLOR = '#8E8E93';

export default function NavBar({ active, language, onChange, onLayoutHeight }: NavBarProps) {
  const tabs: { key: Tab; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'home', icon: 'home', label: t('home', language) },
    { key: 'search', icon: 'search', label: t('search', language) },
    { key: 'orders', icon: 'receipt', label: 'Orders' },
    { key: 'profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <SafeAreaView
      edges={['bottom']}
      style={styles.container}
      onLayout={(event) => onLayoutHeight?.(event.nativeEvent.layout.height)}>
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
