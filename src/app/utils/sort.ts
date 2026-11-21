export type PriceSort = 'price_asc' | 'price_desc' | 'discount_asc' | 'discount_desc';

type PriceLike = {
  price: number;
  discountPercentage?: number;
  discount?: number;
};

export function sortOffersByPrice<T extends PriceLike>(items: T[], direction: 'asc' | 'desc' = 'asc') {
  return [...items].sort((a, b) => {
    const result = a.price - b.price;
    return direction === 'asc' ? result : -result;
  });
}

export function sortOffersByDiscount<T extends PriceLike>(items: T[], direction: 'asc' | 'desc' = 'desc') {
  return [...items].sort((a, b) => {
    const aDiscount = a.discountPercentage ?? a.discount ?? 0;
    const bDiscount = b.discountPercentage ?? b.discount ?? 0;
    const result = aDiscount - bDiscount;
    return direction === 'asc' ? result : -result;
  });
}

export function sortByPriceMode<T extends PriceLike>(items: T[], mode: PriceSort) {
  switch (mode) {
    case 'price_asc':
      return sortOffersByPrice(items, 'asc');
    case 'price_desc':
      return sortOffersByPrice(items, 'desc');
    case 'discount_asc':
      return sortOffersByDiscount(items, 'asc');
    case 'discount_desc':
    default:
      return sortOffersByDiscount(items, 'desc');
  }
}

export default function SortModule() {
  return null;
}
