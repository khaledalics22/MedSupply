import type {
  CartItem,
  ManufacturerProductOffer,
  StoreProductOffer,
} from '../models/data_types';

export type SellerProductOffer = StoreProductOffer | ManufacturerProductOffer;

export function calculatePharmacyPrice(
  consumerPrice: number,
  discountPercentage: number,
): number {
  const consumerCents = Math.round(consumerPrice * 100);
  const discountBasisPoints = Math.round(discountPercentage * 100);
  const discountCents = Math.round((consumerCents * discountBasisPoints) / 10000);
  return Math.round(consumerCents - discountCents) / 100;
}

export function normalizeOfferPrice(
  consumerPrice: number,
  discountPercentage: number,
  pharmacyPriceAfterDiscount?: number,
): number {
  const calculated = calculatePharmacyPrice(consumerPrice, discountPercentage);

  if (pharmacyPriceAfterDiscount === undefined) {
    return calculated;
  }

  const storedCents = Math.round(pharmacyPriceAfterDiscount * 100);
  const calculatedCents = Math.round(calculated * 100);
  if (storedCents !== calculatedCents) {
    throw new Error('Offer discount is inconsistent with its pharmacy price');
  }

  return calculated;
}

export function isOfferAvailable(offer: SellerProductOffer): boolean {
  return offer.isAvailable && offer.stockQuantity > 0;
}

export function sortOffersByPharmacyPrice<T extends SellerProductOffer>(offers: T[]): T[] {
  return [...offers]
    .filter(isOfferAvailable)
    .sort((left, right) =>
      calculatePharmacyPrice(left.consumerPrice, left.discountPercentage) -
      calculatePharmacyPrice(right.consumerPrice, right.discountPercentage),
    );
}

export function canIncreaseCartQuantity(item: CartItem, stockQuantity: number): boolean {
  return item.quantity < stockQuantity;
}

export function increaseCartQuantity(
  cart: CartItem[],
  offerId: string,
  stockQuantity: number,
): CartItem[] {
  return cart.map((item) => {
    if (item.offerId !== offerId) {
      return item;
    }

    if (!canIncreaseCartQuantity(item, stockQuantity)) {
      throw new Error('Requested quantity exceeds available stock');
    }

    return { ...item, quantity: item.quantity + 1 };
  });
}

export function validateCartStock(
  cart: CartItem[],
  getOfferStock: (offerId: string) => { stockQuantity: number; isAvailable: boolean } | undefined,
): void {
  for (const item of cart) {
    const offer = getOfferStock(item.offerId);

    if (!offer || !offer.isAvailable || offer.stockQuantity < item.quantity) {
      throw new Error(`Stock validation failed for ${item.productName}`);
    }
  }
}

export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce(
    (total, item) => total + Math.round(item.unitPrice * 100) * item.quantity,
    0,
  ) / 100;
}
