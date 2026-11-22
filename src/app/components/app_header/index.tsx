import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { type LanguageCode } from "../../i18n";
import styles from "./styles";

type AppHeaderProps = {
  title?: string;
  language?: LanguageCode;
  onLanguageToggle?: () => void;
  notificationsCount?: number;
  onNotificationsPress?: () => void;
  onBack?: () => void;
};

export default function AppHeader({
  title,
  language,
  onLanguageToggle,
  notificationsCount = 0,
  onNotificationsPress,
  onBack,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
      <View style={styles.headerActions}>
        {onLanguageToggle && (
          <TouchableOpacity
            style={styles.languageButton}
            onPress={onLanguageToggle}
            activeOpacity={0.8}
          >
            <Text style={styles.languageButtonText}>
              {language === "en" ? "AR" : "EN"}
            </Text>
          </TouchableOpacity>
        )}

        {onNotificationsPress && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationsPress}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            {notificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
