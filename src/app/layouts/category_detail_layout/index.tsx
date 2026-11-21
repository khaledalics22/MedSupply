import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ProductCard from "../../components/product_card";
import SearchBar from "../../components/search_bar";
import { getLocalizedCategoryTitle, t, type LanguageCode } from "../../i18n";
import { iocContainer } from "../../models/ioc_container";
import { CategoryType } from "../../utils/types";
import { useAppState } from "../../state/app_state";
import styles from "./styles";
import AppHeader from "../../components/app_header";

export default function CategoryDetailLayout({
  categoryType,
  specialtyId,
  language,
  onBack,
  onItemSelected,
  onProductSelected,
}: {
  categoryType: CategoryType;
  specialtyId?: string;
  language: LanguageCode;
  onBack: () => void;
  onItemSelected: (item: any) => void;
  onProductSelected?: (productId: string) => void;
}) {
  const database = iocContainer.getDatabase();
  const { addToCart } = useAppState();
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<
    "none" | "priceAsc" | "priceDesc" | "discount"
  >("none");

  const bestPriceCards = useMemo(() => {
    if (categoryType !== CategoryType.BestPrices) return [];
    const cards: Array<{
      key: string;
      offerType: "store" | "manufacturer";
      offer: any;
      product: any;
      sellerName: string;
      store?: any;
    }> = [];

    for (const offer of database.getStoreOffers()) {
      if (!offer.isAvailable || offer.stockQuantity <= 0) continue;
      const product = database.getProductById(offer.productId);
      const store = database.getStoreById(offer.storeId);
      if (!product || product.sellerType !== "store" || product.sellerId !== offer.storeId || !store) continue;
      cards.push({ key: `store-${offer.id}`, offerType: "store", offer, product, sellerName: store.name, store });
    }

    for (const offer of database.getManufacturerOffers()) {
      if (!offer.isAvailable || offer.stockQuantity <= 0) continue;
      const product = database.getProductById(offer.productId);
      const manufacturer = database.getFactoryById(offer.manufacturerId);
      if (!product || product.sellerType !== "manufacturer" || product.sellerId !== offer.manufacturerId || !manufacturer) continue;
      cards.push({ key: `manufacturer-${offer.id}`, offerType: "manufacturer", offer, product, sellerName: manufacturer.name });
    }

    return cards;
  }, [categoryType, database]);

  const filteredBestPrices = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return bestPriceCards
      .filter((card) => !query || card.product.name.toLowerCase().includes(query) || card.sellerName.toLowerCase().includes(query))
      .sort((left, right) => {
        if (sortMode === "priceAsc") return left.offer.pharmacyPriceAfterDiscount - right.offer.pharmacyPriceAfterDiscount;
        if (sortMode === "priceDesc") return right.offer.pharmacyPriceAfterDiscount - left.offer.pharmacyPriceAfterDiscount;
        if (sortMode === "discount") return right.offer.discountPercentage - left.offer.discountPercentage;
        return left.offer.pharmacyPriceAfterDiscount - right.offer.pharmacyPriceAfterDiscount;
      });
  }, [bestPriceCards, searchText, sortMode]);

  const effectiveSpecialtyId = specialtyId ?? (categoryType === CategoryType.Cosmetics ? "beauty" : undefined);
  const specialtyProducts = effectiveSpecialtyId ? database.getProductsBySpecialty(effectiveSpecialtyId) : [];
  const sellerItems: any[] = categoryType === CategoryType.Stores
    ? database.getStores()
    : categoryType === CategoryType.Manufacturers
      ? database.getFactories()
      : [];

  return (
    <View style={styles.container}>
      <AppHeader
        onBack={onBack}
        title={effectiveSpecialtyId
          ? database.getSpecialtyById(effectiveSpecialtyId)?.name ?? "Specialty"
          : getLocalizedCategoryTitle(categoryType, language)}
      />
      <View style={styles.header}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder={t("searchProducts", language)}
          placeholderTextColor="rgba(255,255,255,0.8)"
        />
      </View>

      {categoryType === CategoryType.BestPrices && (
        <View style={styles.filterRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setSortMode((value) => value === "priceAsc" ? "none" : "priceAsc")} style={[styles.filterButton, sortMode === "priceAsc" && styles.filterButtonActive]}>
            <Text style={[styles.filterButtonText, sortMode === "priceAsc" && styles.filterButtonTextActive]}>Lower price</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setSortMode((value) => value === "discount" ? "none" : "discount")} style={[styles.filterButton, sortMode === "discount" && styles.filterButtonActive]}>
            <Text style={[styles.filterButtonText, sortMode === "discount" && styles.filterButtonTextActive]}>Discount</Text>
          </TouchableOpacity>
        </View>
      )}

      {categoryType === CategoryType.BestPrices ? (
        <FlatList
          data={filteredBestPrices}
          numColumns={2}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={<Text style={styles.emptyState}>{t("noMatchingItems", language)}</Text>}
          renderItem={({ item }) => (
            <ProductCard
              product={item.product}
              offer={item.offer}
              store={item.store}
              manufacturerName={item.offerType === "manufacturer" ? item.sellerName : undefined}
              onPress={() => onProductSelected?.(item.product.id)}
              onAddToCart={() => addToCart(item.offerType, item.offer.id, 1)}
            />
          )}
        />
      ) : categoryType === CategoryType.Specialty ? (
        <FlatList
          data={database.getSpecialties()}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} style={styles.gridCardWrapper} onPress={() => onItemSelected({ id: item.id, name: item.name, type: "specialty" })}>
              <View style={styles.gridCard}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
                <Text style={styles.gridName}>{item.name}</Text>
                <Text style={styles.gridPrice}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : effectiveSpecialtyId ? (
        <FlatList
          data={specialtyProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} style={styles.gridCardWrapper} onPress={() => onProductSelected?.(item.id)}>
              <View style={styles.gridCard}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
                <Text style={styles.gridName}>{item.name}</Text>
                <Text style={styles.gridPrice}>{item.packageSize ?? item.dosage}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={sellerItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} style={styles.gridCardWrapper} onPress={() => onItemSelected({ ...item, type: categoryType === CategoryType.Stores ? "store" : "factory" })}>
              <View style={styles.gridCard}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
                <Text style={styles.gridName}>{item.name}</Text>
                <Text style={styles.gridPrice}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
