import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { getLocalizedItem, t, type LanguageCode } from '../../i18n';
import { Item, ItemType } from '../../utils/types';
import styles from './styles';

type ItemDetailLayoutProps = {
  item: Item;
  language: LanguageCode;
  onBack: () => void;
};

export default function ItemDetailLayout({ item, language, onBack }: ItemDetailLayoutProps) {
  const localizedItem = getLocalizedItem(item, language);

  const renderDetails = () => {
    switch (localizedItem.type) {
      case ItemType.Medicine:
        return (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('price', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.price} EGP</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('discount', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.discount}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('dosage', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.dosage}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('stock', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.stock} {language === 'ar' ? 'وحدة' : 'units'}</Text>
            </View>
          </View>
        );
      case ItemType.Store:
        return (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('address', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('phone', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('openHours', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.openHours}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('rating', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.rating}/5</Text>
            </View>
          </View>
        );
      case ItemType.Factory:
        return (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('location', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('certification', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.certification}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('capacity', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.productionCapacity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('phone', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.phone}</Text>
            </View>
          </View>
        );
      case ItemType.Pharmacy:
        return (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('address', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('phone', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('delivery', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.deliveryHours}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('availableNow', language)}</Text>
              <Text style={styles.detailValue}>{localizedItem.availableNow ? t('yes', language) : t('no', language)}</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{localizedItem.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: localizedItem.image }} style={styles.image} />
        <Text style={styles.typeBadge}>{localizedItem.type}</Text>
        <Text style={styles.description}>{localizedItem.description}</Text>
        {renderDetails()}
      </ScrollView>
    </View>
  );
}
