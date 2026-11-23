import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";

import AdvertisementCarousel from "../../components/advertisement_carousel";
import AppHeader from "../../components/app_header";
import CategoryItem from "../../components/category_item";
import SearchBar from "../../components/search_bar";
import { t, type LanguageCode } from "../../i18n";
import { iocContainer } from "../../models/ioc_container";
import { CategoryType } from "../../utils/types";
import styles from "./styles";

type HomeProps = {
  language: LanguageCode;
  notificationsCount?: number;
  onLanguageChange: (language: LanguageCode) => void;
  onCategorySelected: (type: CategoryType) => void;
  onNotificationsPress?: () => void;
  onSearchPress?: () => void;
};

export default function Home({
  language,
  notificationsCount = 0,
  onLanguageChange,
  onCategorySelected,
  onNotificationsPress,
  onSearchPress,
}: HomeProps) {
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const categories = [
      {
        id: "1",
        type: CategoryType.Specialty,
        title: "التخصصات",
        description:
          "ابحث عن دوائك من خلال التخصص (القلب - العيون -باطنة- ...)",
        image: "https://picsum.photos/seed/medicines/100",
        route: "specialties",
        sortOrder: 1,
        itemLayout: "grid",
        isActive: true,
      },
      {
        id: "2",
        type: CategoryType.BestPrices,
        title: "أفضل الأسعار",
        description: "أفضل الأسعار على الأدوية",
        image: "https://picsum.photos/seed/equipment/100",
        route: "best-prices",
        sortOrder: 2,
        itemLayout: "list",
        isActive: true,
      },
      {
        id: "3",
        type: CategoryType.Manufacturers,
        title: "المصانع",
        description: "ابحث عن المصانع",
        image: "https://picsum.photos/seed/supplies/100",
        route: "manufacturers",
        sortOrder: 3,
        itemLayout: "grid",
        isActive: true,
      },
      {
        id: "4",
        type: CategoryType.Stores,
        title: "المخازن",
        description: "ابحث فى المخازن",
        image: "https://picsum.photos/seed/devices/100",
        route: "stores",
        sortOrder: 4,
        itemLayout: "grid",
        isActive: true,
      },
      {
        id: "5",
        type: CategoryType.Cosmetics,
        title: "مستحضرات التجميل",
        description: "ابحث عن مستحضرات التجميل",
        image: "https://picsum.photos/seed/cosmetics/100",
        route: "cosmetics",
        sortOrder: 5,
        itemLayout: "list",
        isActive: true,
      },
    ];
    return categories
      .map((category) => ({
        ...category,
        title:category.title,
        description: category.description,
      }))
      .filter((category) => {
        if (!query.trim()) {
          return true;
        }

        const pattern = query.trim().toLowerCase();
        return (
          category.title.toLowerCase().includes(pattern) ||
          category.description.toLowerCase().includes(pattern)
        );
      });
  }, [language, query]);

  const advertisements = iocContainer.getDatabase().getAdvertisements();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppHeader
          title="MedSupply"
          language={language}
          onLanguageToggle={() =>
            onLanguageChange(language === "en" ? "ar" : "en")
          }
          onNotificationsPress={onNotificationsPress}
          notificationsCount={notificationsCount}
        />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchProducts", language)}
          placeholderTextColor="rgba(255,255,255,0.8)"
          onPress={onSearchPress}
        />
      </View>

      {query.trim() === "" && (
        <AdvertisementCarousel advertisements={advertisements} />
      )}

      <FlatList
        key={"list"}
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CategoryItem
            type={item.type}
            title={item.title}
            description={item.description}
            image={item.image}
            onPress={onCategorySelected}
          />
        )}
      />
    </View>
  );
}
