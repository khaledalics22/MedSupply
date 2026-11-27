import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';

export default function FilterPanel({
  visible,
  title,
  clearLabel,
  applyLabel,
  onClear,
  onApply,
  children,
}: {
  visible: boolean;
  title: string;
  clearLabel: string;
  applyLabel: string;
  onClear: () => void;
  onApply: () => void;
  children: ReactNode;
}) {
  if (!visible) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.clear} onPress={onClear}><Text style={styles.clearText}>{clearLabel}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.apply} onPress={onApply}><Text style={styles.applyText}>{applyLabel}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#D9E3EF', padding: 12 },
  title: { color: '#102A43', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  content: { gap: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  clear: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#D9E3EF', alignItems: 'center', justifyContent: 'center' },
  apply: { flex: 1, height: 42, borderRadius: 10, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center' },
  clearText: { color: '#334E68', fontWeight: '800' }, applyText: { color: '#FFFFFF', fontWeight: '800' },
});
