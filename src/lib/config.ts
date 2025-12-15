import { AppConfig } from '@/types'

export const APP_CONFIG: AppConfig = {
  points: {
    perMinute: 1,
    dailyLimit: 2880, // 48 hours worth at 1 point per minute
    minWithdraw: 20000, // $2 minimum
    toDollarRate: 10000, // 10,000 points = $1
  },
  session: {
    heartbeatInterval: 60000, // 1 minute
    maxIdleTime: 300000, // 5 minutes
  },
  withdraw: {
    minAmount: 2, // $2 USD
    maxAmount: 1000, // $1000 USD
    processingTime: '1-3 أيام عمل',
  },
}

export const GAME_CATEGORIES = {
  action: 'أكشن',
  puzzle: 'ألغاز',
  racing: 'سباق',
  sports: 'رياضة',
  strategy: 'استراتيجية',
  arcade: 'أركيد',
  adventure: 'مغامرة',
  shooting: 'إطلاق نار',
  platform: 'منصات',
  casual: 'عادية',
} as const

export const GAME_PROVIDERS = {
  GameMonetize: 'GameMonetize',
  Custom: 'مخصص',
  Partner: 'شريك',
  Mock: 'تجريبي',
} as const

export const ROUTES = {
  HOME: '/',
  GAMES: '/games',
  GAME: '/game',
  OFFERS: '/offers',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  WITHDRAW: '/withdraw',
  PROFILE: '/profile',
  SUPPORT: '/support',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_GAMES: '/admin/games',
  ADMIN_WITHDRAWALS: '/admin/withdrawals',
  ADMIN_SETTINGS: '/admin/settings',
} as const