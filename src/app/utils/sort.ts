export type PriceSort = 'price_asc' | 'price_desc' | 'discount_asc' | 'discount_desc';

export type ProductPriceLike = {
  pharmacyPriceAfterDiscount: number;
  discountPercentage: number;
};

export function sortProductsByPrice<T extends ProductPriceLike>(items: T[], direction: 'asc' | 'desc' = 'asc') {
  return [...items].sort((a, b) => {
    const result = a.pharmacyPriceAfterDiscount - b.pharmacyPriceAfterDiscount;
    return direction === 'asc' ? result : -result;
  });
}

export function sortProductsByDiscount<T extends ProductPriceLike>(items: T[], direction: 'asc' | 'desc' = 'desc') {
  return [...items].sort((a, b) => {
    const result = a.discountPercentage - b.discountPercentage;
    return direction === 'asc' ? result : -result;
  });
}

export function sortByPriceMode<T extends ProductPriceLike>(items: T[], mode: PriceSort) {
  switch (mode) {
    case 'price_asc': return sortProductsByPrice(items, 'asc');
    case 'price_desc': return sortProductsByPrice(items, 'desc');
    case 'discount_asc': return sortProductsByDiscount(items, 'asc');
    case 'discount_desc':
    default: return sortProductsByDiscount(items, 'desc');
  }
}

export default function SortModule() {
  return null;
}
