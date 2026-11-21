import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import ProductCard from '../../components/product_card';
import { type LanguageCode } from '../../i18n';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function FactoryDetailLayout({
  factoryId,
  language,
  onBack,
  onProductSelected,
}: {
  factoryId: string;
  language: LanguageCode;
  onBack: () => void;
  onProductSelected?: (productId: string) => void;
}) {
  const database = iocContainer.getDatabase();
  const { addToCart } = useAppState();
  const factory = database.getFactoryById(factoryId);

  if (!factory) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Factory not found</Text>
        </View>
      </View>
    );
  }

  const products = database.getProductsByManufacturer(factoryId);
  const offers = database.getManufacturerOffersByManufacturer(factoryId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{factory.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: factory.image ?? 'https://picsum.photos/seed/factory/240' }} style={styles.image} />

        <View style={styles.infoCard}>
          <Text style={styles.name}>{factory.name}</Text>
          <Text style={styles.description}>{factory.description ?? 'No description available.'}</Text>
          <Text style={styles.detail}>Location: {typeof factory.location === 'string' ? factory.location : 'Location unavailable'}</Text>
          <Text style={styles.detail}>Certification: {factory.certification}</Text>
          <Text style={styles.detail}>Capacity: {factory.productionCapacity}</Text>
        </View>

        <Text style={styles.sectionTitle}>Factory products</Text>
        <View style={styles.listWrap}>
          {products.map((product) => {
            const offer = offers.find((candidate) => candidate.productId === product.id);
            if (!offer) return null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                offer={offer}
                manufacturerName={factory.name}
                onPress={() => onProductSelected?.(product.id)}
                onAddToCart={() => addToCart('manufacturer', offer.id, 1)}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
