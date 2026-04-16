// Content Types
export const CONTENT_TYPES = {
  MOVIE: 'movie',
  TV_SERIES: 'tv_series',
};

// Age Ratings
export const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'];

// Video Qualities
export const QUALITY_OPTIONS = ['240p', '480p', '720p', '1080p', '4K'];

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  VIP: 'vip',
};

export const PLANS_DETAILS = {
  free: {
    name: 'Free',
    price: 0,
    maxScreens: 1,
    maxQuality: '480p',
    features: ['Limited content', 'Ad-supported', '1 screen'],
  },
  basic: {
    name: 'Basic',
    price: 99,
    maxScreens: 1,
    maxQuality: '720p',
    features: ['Full content library', 'No ads', '1 screen', 'HD quality'],
  },
  premium: {
    name: 'Premium',
    price: 199,
    maxScreens: 4,
    maxQuality: '1080p',
    features: ['Full content library', 'No ads', '4 screens', 'Full HD quality'],
  },
  vip: {
    name: 'VIP',
    price: 299,
    maxScreens: 6,
    maxQuality: '4K',
    features: ['Full content library', 'No ads', '6 screens', '4K quality', 'Priority support'],
  },
};

// Common Genres
export const GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Thriller',
  'Animation',
  'Documentary',
  'Sci-Fi',
  'Fantasy',
  'Adventure',
  'Crime',
];

// Billing Cycles
export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

// Rating Range
export const RATING_RANGE = {
  MIN: 1,
  MAX: 10,
};
