export type LanguageCode = 'en' | 'ar';

export const defaultLanguage: LanguageCode = 'en';

export const languageOptions: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
];

export const translations = {
  en: {
    home: 'Home',
    search: 'Search',
    lookFor: 'Look for',
    addCredit: 'Add credit',
    searchProducts: 'Search products...',
    noCategoryFound: 'No category found',
    noMatchingItems: 'No matching items found',
    settings: 'Language',
    open: 'Open',
    closed: 'Closed',
    yes: 'Yes',
    no: 'No',
    price: 'Price',
    discount: 'Discount',
    dosage: 'Dosage',
    stock: 'Stock',
    address: 'Address',
    phone: 'Phone',
    openHours: 'Open hours',
    rating: 'Rating',
    location: 'Location',
    certification: 'Certification',
    capacity: 'Capacity',
    delivery: 'Delivery',
    availableNow: 'Available now',
  },
  ar: {
    home: 'الرئيسية',
    search: 'بحث',
    lookFor: 'ابحث عن',
    addCredit: 'إضافة رصيد',
    searchProducts: 'ابحث عن المنتجات...',
    noCategoryFound: 'لا توجد فئة',
    noMatchingItems: 'لا توجد عناصر مطابقة',
    settings: 'اللغة',
    open: 'مفتوح',
    closed: 'مغلق',
    yes: 'نعم',
    no: 'لا',
    price: 'السعر',
    discount: 'التخفيض',
    dosage: 'الجرعة',
    stock: 'المخزون',
    address: 'العنوان',
    phone: 'الهاتف',
    openHours: 'ساعات العمل',
    rating: 'التقييم',
    location: 'الموقع',
    certification: 'الشهادة',
    capacity: 'السعة',
    delivery: 'التوصيل',
    availableNow: 'متاح الآن',
  },
} as const;

export function t(key: keyof (typeof translations)['en'], language: LanguageCode = defaultLanguage) {
  return translations[language][key] ?? translations.en[key] ?? key;
}

export function getLocalizedCategoryTitle(categoryType: string, language: LanguageCode) {
  const englishTitles: Record<string, string> = {
    Medicines: 'Medicines',
    'Best Prices': 'Best Prices',
    Factories: 'Factories',
    Stores: 'Stores',
    Cosmetics: 'Cosmetics',
  };

  const arabicTitles: Record<string, string> = {
    Medicines: 'الأدوية',
    'Best Prices': 'أفضل الأسعار',
    Factories: 'المصانع',
    Stores: 'المتاجر',
    Cosmetics: 'مستحضرات التجميل',
  };

  const mapping = language === 'ar' ? arabicTitles : englishTitles;
  return mapping[categoryType] ?? categoryType;
}

export function getLocalizedItem(item: any, language: LanguageCode) {
  if (language === 'en') {
    return item;
  }

  const arabicNames: Record<string, string> = {
    Paracetamol: 'باراسيتامول',
    Amoxicillin: 'أموكسيسيلين',
    'Vitamin C': 'فيتامين سي',
    'Blood Pressure Monitor': 'جهاز قياس ضغط الدم',
    Thermometer: 'ميزان حرارة',
    'Face Mask Pack': 'عبوة قناع وجه',
    'CityCare Pharmacy': 'صيدلية سيتي كير',
    'Wellness Hub': 'مركز العناية الصحية',
    'Prime Pharma Labs': 'مختبرات برايم فارما',
    'Nova Health Manufacturing': 'تصنيع نوفا هيلث',
    'BrightCare Pharmacy': 'صيدلية برايت كير',
    'CareFirst Pharmacy': 'صيدلية كير فيرست',
  };

  const arabicDescriptions: Record<string, string> = {
    'Pain relief and fever reducer': 'تخفيف الآلام وخافض للحرارة',
    'Broad-spectrum antibiotic': 'مضاد حيوي واسع الطيف',
    'Daily immunity support': 'دعم يومي للمناعة',
    'Portable digital monitoring device': 'جهاز مراقبة رقمي محمول',
    'Digital body thermometer': 'ميزان حرارة للجسم رقمي',
    'Protective medical masks': 'أقنعة طبية واقية',
    'Full-service pharmacy with home delivery': 'صيدلية متكاملة مع توصيل منزلي',
    'Supplements and personal health products': 'مكملات ومنتجات صحية شخصية',
    'Manufacturing sterile pharmaceutical products': 'تصنيع منتجات صيدلانية معقمة',
    'Medical device and diagnostic production': 'إنتاج الأجهزة الطبية والتشخيصية',
    '24/7 emergency pharmacy with express delivery': 'صيدلية طوارئ على مدار الساعة مع توصيل سريع',
    'Prescription and wellness pharmacy': 'صيدلية وصفات وصحة عامة',
  };

  const localized = { ...item };

  if (arabicNames[item.name]) {
    localized.name = arabicNames[item.name];
  }

  if (arabicDescriptions[item.description]) {
    localized.description = arabicDescriptions[item.description];
  }

  return localized;
}

export default function I18nModule() {
  return null;
}
