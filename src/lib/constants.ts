export const OTP_EXPIRY_SECONDS = 600;
export const OTP_MAX_ATTEMPTS = 3;
export const SCAN_IDEMPOTENCY_WINDOW_SECONDS = 60;
export const JWT_EXPIRY = '30d';
export const QR_SPEND_EXPIRY_SECONDS = 300;

export const PLAN_LIMITS = {
  free:         { campaigns: 2, customers: 500 },
  starter:      { campaigns: 5, customers: 1000 },
  professional: { campaigns: Infinity, customers: 5000 },
} as const;

export const DEMO_MERCHANTS = [
  'brewhouse-cafe',
  'bella-beauty',
  'the-fit-club',
  'metro-deli',
  'luxe-boutique',
  'casa-pizzeria',
] as const;

export const MERCHANT_CATEGORIES = {
  café: { icon: 'Coffee', label: 'Café' },
  salon: { icon: 'Scissors', label: 'Salon' },
  gym: { icon: 'Dumbbell', label: 'Gym' },
  deli: { icon: 'ShoppingBag', label: 'Deli' },
  boutique: { icon: 'ShoppingBag', label: 'Boutique' },
  restaurant: { icon: 'Pizza', label: 'Restaurant' },
} as const;
