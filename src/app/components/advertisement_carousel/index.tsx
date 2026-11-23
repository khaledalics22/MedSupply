import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';

import styles from './styles';

export type Advertisement = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  backgroundColor?: string;
  isActive?: boolean;
  sortOrder?: number;
};

type AdvertisementCarouselProps = {
  advertisements: Advertisement[];
};

export default function AdvertisementCarousel({ advertisements }: AdvertisementCarouselProps) {
  const [mounted, setMounted] = useState(false);
  // card width should be the whole layout width on any phone 
  const cardWidth = Math.max(360, Dimensions.get('window').width - 20);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      style={styles.container}>
      {mounted && advertisements.map((ad) => (
        <View
          key={ad.id}
          style={[
            styles.card,
            { backgroundColor: ad.backgroundColor ?? '#208AEF',
              width: cardWidth
             },
          ]}>
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              {ad.image && (
                <View style={styles.imagePlaceholder} />
              )}
              <View style={styles.textWrap}>
                <Text style={styles.title}>{ad.title}</Text>
                {ad.description && (
                  <Text style={styles.description}>
                    {ad.description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
